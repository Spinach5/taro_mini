import { View, Text, Input, Textarea, ScrollView, Image } from "@tarojs/components";
import Taro, { useLoad, useUnload } from "@tarojs/taro";
import { useState } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import { MaterialCommunityIcons } from "taro-icons";
import SafeAreaView from "../../../../components/SafeAreaView";
import HeadStatus from "../../../../components/HeadStatus";
import {
  getBookDetail,
  getBookCategories,
  createBook,
  updateBook,
  uploadBookImage,
} from "../../../../service";
import cacheManager from "../../../../utils/cache";
import runtimeLogger from "../../../../utils/runtimeLogger";
import "./index.css";

const CONDITION_OPTIONS = ["全新", "几乎全新", "有笔记", "较旧"];
const DRAFT_KEY = "v1_book_draft";

export default function Index() {
  const router = Taro.useRouter();
  const editId = router.params.id || "";
  const isEdit = !!editId;

  const draftCache = isEdit ? null : cacheManager.get(DRAFT_KEY);

  const [name, setName] = useState(draftCache?.name || "");
  const [isbn, setIsbn] = useState(draftCache?.isbn || "");
  const [category, setCategory] = useState(draftCache?.category || "");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [price, setPrice] = useState(draftCache?.price || "");
  const [condition, setCondition] = useState(draftCache?.condition || "几乎全新");
  const [contact, setContact] = useState(draftCache?.contact || "");
  const [description, setDescription] = useState(draftCache?.description || "");
  const [images, setImages] = useState(draftCache?.images || []);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);

  // 保存草稿
  const saveDraft = (silent = false) => {
    if (isEdit) return;
    const draft = { name, isbn, category, price, condition, contact, description, images };
    if (name || isbn || price || contact || images.length > 0) {
      cacheManager.set(DRAFT_KEY, draft);
      if (!silent) Taro.showToast({ title: "已保存为草稿", icon: "success" });
    }
  };

  const clearDraft = () => cacheManager.remove(DRAFT_KEY);

  useUnload(() => clearDraft());

  useLoad(() => {
    (async () => {
      try {
        const cats = await getBookCategories();
        setCategoryOptions((cats || []).filter((c) => c !== "全部"));
      } catch {}
      if (isEdit) {
        try {
          const data = await getBookDetail(editId);
          if (data) {
            setName(data.name || "");
            setIsbn(data.isbn || "");
            setCategory(data.category || "");
            setPrice(data.price != null ? String(data.price) : "");
            setCondition(data.condition || "几乎全新");
            setContact(data.contact || "");
            setDescription(data.description || "");
            setImages((data.images || []).map((img) => ({ tempFilePath: img.url })));
          }
        } catch (error) {
          runtimeLogger.error("BookEdit", "获取详情失败", error);
          Taro.showToast({ title: "加载失败", icon: "none" });
        }
      }
      setFetched(true);
    })();
  });

  const handleChooseImage = () => {
    const count = 3 - images.length;
    if (count <= 0) return;
    Taro.chooseImage({
      count,
      sizeType: ["compressed"],
      success: (res) => {
        const newImgs = res.tempFilePaths.map((p) => ({ tempFilePath: p }));
        setImages([...images, ...newImgs]);
      },
    });
  };

  const handleDeleteImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleScan = () => {
    Taro.showToast({ title: "正在打开扫码...", icon: "none" });
  };

  const handleSubmit = async () => {
    if (!name.trim()) { Taro.showToast({ title: "请输入书籍名称", icon: "none" }); return; }
    if (!price.trim()) { Taro.showToast({ title: "请输入售价", icon: "none" }); return; }
    if (!contact.trim()) { Taro.showToast({ title: "请输入联系方式", icon: "none" }); return; }
    if (submitting || uploading) return;

    setSubmitting(true);
    try {
      // 上传图片
      setUploading(true);
      const uploadedUrls = [];
      for (const img of images) {
        if (img.tempFilePath && !img.tempFilePath.startsWith("http")) {
          const result = await uploadBookImage(img.tempFilePath);
          if (result?.url) uploadedUrls.push(result.url);
        } else {
          uploadedUrls.push(img.tempFilePath);
        }
      }
      setUploading(false);

      const data = { name: name.trim(), isbn: isbn.trim(), category, price: price.trim(), condition, contact: contact.trim(), description: description.trim(), images: uploadedUrls };

      await (isEdit ? updateBook(editId, data) : createBook(data));
      clearDraft();
      Taro.showToast({ title: "发布成功", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 1500);
    } catch (error) {
      runtimeLogger.error("BookEdit", "发布失败", error);
      Taro.showToast({ title: error.message || "发布失败", icon: "none" });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleBack = () => {
    const pages = Taro.getCurrentPages();
    pages.length > 1 ? Taro.navigateBack() : Taro.redirectTo({ url: "/modules/pages/book/index" });
  };

  if (!fetched) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <View className="back-btn" onClick={handleBack}>
            <AtIcon value="arrow-left" color="#ffffff" size={20} />
          </View>
          <HeadStatus text={isEdit ? "编辑书籍" : "发布书籍"} />
        </View>
        <View className="edit-loading">
          <AtActivityIndicator isOpened size={32} mode="center" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <View className="back-btn" onClick={handleBack}>
          <AtIcon value="arrow-left" color="#ffffff" size={20} />
        </View>
        <HeadStatus text={isEdit ? "编辑书籍" : "发布书籍"} />
      </View>

      <ScrollView scrollY className="edit-scroll" enhanced bounces={false}>

        {/* 1. 图片上传区 */}
        <View className="edit-section">
          <View className="image-upload-area" onClick={handleChooseImage}>
            {images.length > 0 ? (
              <View className="image-preview-grid">
                {images.map((img, idx) => (
                  <View key={img.tempFilePath || idx} className="preview-item">
                    <Image className="preview-img" src={img.tempFilePath} mode="aspectFill" />
                    <View className="preview-delete" onClick={(e) => { e.stopPropagation(); handleDeleteImage(idx); }}>
                      <MaterialCommunityIcons name="close-circle" size={22} color="#e74c3c" />
                    </View>
                  </View>
                ))}
                {images.length < 3 && (
                  <View className="preview-add">
                    <MaterialCommunityIcons name="plus" size={32} color="#bbb" />
                    <Text className="preview-add-text">添加图片</Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="upload-placeholder">
                <MaterialCommunityIcons name="camera-plus-outline" size={48} color="#bbb" />
                <Text className="upload-hint">上传书籍图片</Text>
                <Text className="upload-sub">最多3张，点击选择</Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. 书籍名称 */}
        <View className="edit-section">
          <View className="field-label">书籍名称</View>
          <Input className="field-input" placeholder="请输入书籍名称" value={name} onInput={(e) => setName(e.detail.value)} maxlength={100} />
        </View>

        {/* 3. ISBN + 扫码 */}
        <View className="edit-section">
          <View className="field-label">ISBN</View>
          <View className="field-row">
            <Input className="field-input flex-1" placeholder="输入或扫码获取ISBN" value={isbn} onInput={(e) => setIsbn(e.detail.value)} maxlength={50} />
            <View className="scan-btn" onClick={handleScan}>
              <MaterialCommunityIcons name="barcode-scan" size={20} color="#fff" />
            </View>
          </View>
        </View>

        {/* 4. 价格 */}
        <View className="edit-section">
          <View className="field-label">价格</View>
          <View className="field-row">
            <Text className="price-prefix">¥</Text>
            <Input className="field-input flex-1" type="digit" placeholder="请输入售价" value={price} onInput={(e) => setPrice(e.detail.value)} />
          </View>
        </View>

        {/* 5. 成色 — 胶囊单选 */}
        <View className="edit-section">
          <View className="field-label">成色</View>
          <View className="pill-row">
            {CONDITION_OPTIONS.map((opt) => (
              <View
                key={opt}
                className={`pill-item ${condition === opt ? "pill-active" : ""}`}
                onClick={() => setCondition(opt)}
              >
                <Text className="pill-text">{opt}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. 种类 — 下拉 */}
        <View className="edit-section">
          <View className="field-label">种类</View>
          <View className="field-picker" onClick={() => setShowCatPicker(!showCatPicker)}>
            <Text className={category ? "picker-val" : "picker-placeholder"}>{category || "请选择种类"}</Text>
            <MaterialCommunityIcons name={showCatPicker ? "chevron-up" : "chevron-down"} size={20} color="#999" />
          </View>
          {showCatPicker && (
            <View className="picker-drop">
              {categoryOptions.map((cat) => (
                <View
                  key={cat}
                  className={`picker-opt ${category === cat ? "picker-opt-active" : ""}`}
                  onClick={() => { setCategory(cat); setShowCatPicker(false); }}
                >
                  <Text>{cat}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 7. 联系方式 */}
        <View className="edit-section">
          <View className="field-label">联系方式</View>
          <Input className="field-input" placeholder="请输入微信号或手机号" value={contact} onInput={(e) => setContact(e.detail.value)} maxlength={50} />
          <Text className="field-hint">仅对登录用户可见</Text>
        </View>

        {/* 8. 详细描述 */}
        <View className="edit-section">
          <View className="field-label">详细描述</View>
          <Textarea
            className="field-textarea"
            placeholder="请描述书籍的新旧程度、使用情况、出售原因等..."
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
            autoHeight
          />
        </View>

        <View style={{ height: "140rpx" }} />
      </ScrollView>

      {/* 底部按钮 */}
      <View className="edit-bottom">
        <View className="draft-btn" onClick={() => saveDraft()}>
          <MaterialCommunityIcons name="content-save-outline" size={20} color="#999" />
          <Text className="draft-text">存为草稿</Text>
        </View>
        <View className={`publish-btn ${(!name.trim() || !price.trim() || !contact.trim() || submitting) ? "publish-disabled" : ""}`} onClick={handleSubmit}>
          <MaterialCommunityIcons name="send" size={20} color={(!name.trim() || !price.trim() || !contact.trim()) ? "#ccc" : "#000"} />
          <Text className="publish-text">{uploading ? "上传中..." : submitting ? "发布中..." : "发布"}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
