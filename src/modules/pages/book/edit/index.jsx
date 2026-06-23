import { View, Text, Input, Textarea, ScrollView, Image } from "@tarojs/components";
import Taro, { useLoad, useUnload } from "@tarojs/taro";
import { useState } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
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

  // 尝试从缓存恢复草稿
  const draftCache = isEdit ? null : cacheManager.get(DRAFT_KEY);

  const [name, setName] = useState(draftCache?.name || "");
  const [isbn, setIsbn] = useState(draftCache?.isbn || "");
  const [category, setCategory] = useState(draftCache?.category || "");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [price, setPrice] = useState(draftCache?.price || "");
  const [condition, setCondition] = useState(draftCache?.condition || "全新");
  const [description, setDescription] = useState(draftCache?.description || "");
  const [images, setImages] = useState(draftCache?.images || []); // [{ tempFilePath }]
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showCondPicker, setShowCondPicker] = useState(false);

  // 保存草稿到缓存
  const saveDraft = () => {
    if (isEdit) return; // 编辑模式不保存草稿
    const draft = { name, isbn, category, price, condition, description, images };
    if (name || isbn || category || price || images.length > 0) {
      cacheManager.set(DRAFT_KEY, draft);
    }
  };

  // 清空草稿
  const clearDraft = () => {
    cacheManager.remove(DRAFT_KEY);
  };

  // 退出时清空草稿
  useUnload(() => {
    clearDraft();
  });

  useLoad(() => {
    (async () => {
      try {
        const cats = await getBookCategories();
        setCategoryOptions((cats || []).filter((c) => c !== "全部"));
      } catch { }

      if (isEdit) {
        try {
          const data = await getBookDetail(editId);
          if (data) {
            setName(data.name || "");
            setIsbn(data.isbn || "");
            setCategory(data.category || "");
            setPrice(data.price != null ? String(data.price) : "");
            setCondition(data.condition || "全新");
            setDescription(data.description || "");
            // 编辑模式：已有图片是 URL，包装一下
            setImages((data.images || []).map((img) => ({ tempFilePath: img.url })));
          }
        } catch (error) {
          runtimeLogger.error("BookEdit", "获取书籍详情失败", error);
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
        const newImages = res.tempFilePaths.map((p) => ({ tempFilePath: p }));
        const updated = [...images, ...newImages];
        setImages(updated);
        // 立即保存草稿
        if (!isEdit) {
          const draft = { name, isbn, category, price, condition, description, images: updated };
          cacheManager.set(DRAFT_KEY, draft);
        }
      },
    });
  };

  const handleDeleteImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (!isEdit) {
      cacheManager.set(DRAFT_KEY, { name, isbn, category, price, condition, description, images: updated });
    }
  };

  const canSubmit = name.trim() && isbn.trim() && category && price.trim() && !uploading;

  const handleSubmit = async () => {
    if (!canSubmit || submitting || uploading) return;

    setSubmitting(true);
    try {
      // 先上传所有临时图片
      setUploading(true);
      const uploadedUrls = [];
      for (const img of images) {
        try {
          // 编辑模式：已有服务器图片不需要重新上传
          if (img.tempFilePath && !img.tempFilePath.startsWith("http")) {
            const result = await uploadBookImage(img.tempFilePath);
            if (result && result.url) {
              uploadedUrls.push(result.url);
            }
          } else {
            // 已有图片 URL 直接使用
            uploadedUrls.push(img.tempFilePath);
          }
        } catch {
          Taro.showToast({ title: "图片上传失败", icon: "none" });
          setUploading(false);
          setSubmitting(false);
          return;
        }
      }
      setUploading(false);

      const data = {
        name: name.trim(),
        isbn: isbn.trim(),
        category,
        price: price.trim(),
        condition,
        description: description.trim(),
        images: uploadedUrls,
      };

      await (isEdit ? updateBook(editId, data) : createBook(data));

      clearDraft();
      Taro.showToast({ title: isEdit ? "更新成功" : "发布成功", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 1500);
    } catch (error) {
      runtimeLogger.error("BookEdit", "提交书籍失败", error);
      Taro.showToast({ title: error.message || "提交失败，请稍后重试", icon: "none" });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // 返回处理
  const handleBack = () => {
    const pages = Taro.getCurrentPages();
    if (pages.length > 1) {
      Taro.navigateBack();
    } else {
      Taro.redirectTo({ url: "/modules/pages/book/index" });
    }
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
        <View className="loading-view">
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

      <ScrollView scrollY className="form-scroll" enhanced bounces={false}>
        {/* 书名 */}
        <View className="form-group">
          <Text className="form-label">书名 *</Text>
          <View className="form-input-wrap">
            <Input
              className="form-input"
              placeholder="请输入书名"
              value={name}
              onInput={(e) => { setName(e.detail.value); saveDraft(); }}
              maxlength={100}
            />
          </View>
        </View>

        {/* 书号/ISBN */}
        <View className="form-group">
          <Text className="form-label">书号/ISBN *</Text>
          <View className="form-input-wrap">
            <Input
              className="form-input"
              placeholder="请输入书号或ISBN"
              value={isbn}
              onInput={(e) => { setIsbn(e.detail.value); saveDraft(); }}
              maxlength={50}
            />
          </View>
        </View>

        {/* 种类 */}
        <View className="form-group">
          <Text className="form-label">种类 *</Text>
          <View className="form-picker" onClick={() => setShowCatPicker(!showCatPicker)}>
            <Text className={`picker-value ${!category ? "picker-placeholder" : ""}`}>
              {category || "请选择种类"}
            </Text>
            <AtIcon value={showCatPicker ? "chevron-up" : "chevron-down"} size={16} color="#999" />
          </View>
          {showCatPicker && (
            <View className="picker-options">
              {categoryOptions.map((cat) => (
                <View
                  key={cat}
                  className={`picker-option ${category === cat ? "picker-option-active" : ""}`}
                  onClick={() => { setCategory(cat); setShowCatPicker(false); saveDraft(); }}
                >
                  <Text>{cat}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 价格 */}
        <View className="form-group">
          <Text className="form-label">价格 *</Text>
          <View className="form-input-wrap">
            <Text className="price-prefix">¥</Text>
            <Input
              className="form-input"
              type="digit"
              placeholder="请输入价格"
              value={price}
              onInput={(e) => { setPrice(e.detail.value); saveDraft(); }}
            />
          </View>
        </View>

        {/* 新旧程度 */}
        <View className="form-group">
          <Text className="form-label">新旧程度</Text>
          <View className="form-picker" onClick={() => setShowCondPicker(!showCondPicker)}>
            <Text className="picker-value">{condition}</Text>
            <AtIcon value={showCondPicker ? "chevron-up" : "chevron-down"} size={16} color="#999" />
          </View>
          {showCondPicker && (
            <View className="picker-options">
              {CONDITION_OPTIONS.map((opt) => (
                <View
                  key={opt}
                  className={`picker-option ${condition === opt ? "picker-option-active" : ""}`}
                  onClick={() => { setCondition(opt); setShowCondPicker(false); saveDraft(); }}
                >
                  <Text>{opt}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 描述 */}
        <View className="form-group">
          <Text className="form-label">描述</Text>
          <Textarea
            className="form-textarea"
            placeholder="请输入书籍描述（选填）"
            value={description}
            onInput={(e) => { setDescription(e.detail.value); saveDraft(); }}
            maxlength={500}
            autoHeight
          />
        </View>

        {/* 图片区 */}
        <View className="form-group">
          <Text className="form-label">图片（最多3张）</Text>
          <View className="image-grid">
            {images.map((img, idx) => (
              <View key={img.tempFilePath || idx} className="image-item">
                <Image className="image-thumb" src={img.tempFilePath} mode="aspectFill" />
                <View className="image-delete" onClick={() => handleDeleteImage(idx)}>
                  <Text className="image-delete-icon">×</Text>
                </View>
              </View>
            ))}
            {images.length < 3 && (
              <View className="image-add" onClick={handleChooseImage}>
                <Text className="image-add-icon">+</Text>
              </View>
            )}
          </View>
        </View>

        {/* 提交按钮 */}
        <View className="form-group">
          <View
            className={`submit-btn ${!canSubmit || submitting ? "submit-btn-disabled" : ""}`}
            onClick={handleSubmit}
          >
            <Text className="submit-text">
              {uploading ? "上传图片中..." : submitting ? "提交中..." : isEdit ? "保存修改" : "发布"}
            </Text>
          </View>
        </View>

        <View style={{ height: "60rpx" }} />
      </ScrollView>
    </SafeAreaView>
  );
}
