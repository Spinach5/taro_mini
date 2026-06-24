import { View, Text, Input, Textarea, ScrollView, Image } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import { useState } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import { MaterialCommunityIcons } from "taro-icons";
import SafeAreaView from "../../../../components/SafeAreaView";
import HeadStatus from "../../../../components/HeadStatus";
import {
  getBookCategories,
  createBook,
  uploadBookImage,
} from "../../../../service";
import cacheManager from "../../../../utils/cache";
import runtimeLogger from "../../../../utils/runtimeLogger";
import "../edit/index.css";

const DRAFT_KEY = "v1_buy_draft";

export default function Index() {
  const draftCache = cacheManager.get(DRAFT_KEY);

  const [name, setName] = useState(draftCache?.name || "");
  const [isbn, setIsbn] = useState(draftCache?.isbn || "");
  const [category, setCategory] = useState(draftCache?.category || "");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [price, setPrice] = useState(draftCache?.price || "");
  const [contact, setContact] = useState(draftCache?.contact || "");
  const [description, setDescription] = useState(draftCache?.description || "");
  const [images, setImages] = useState(draftCache?.images || []);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showIsbnModal, setShowIsbnModal] = useState(false);
  const [isbnInput, setIsbnInput] = useState("");
  const [isbnFetching, setIsbnFetching] = useState(false);
  const [author, setAuthor] = useState(draftCache?.author || "");
  const [publisher, setPublisher] = useState(draftCache?.publisher || "");

  // 保存草稿
  const saveDraft = (silent = false) => {
    const draft = { name, isbn, category, price, contact, description, images, author, publisher };
    if (name || isbn || price || contact || images.length > 0) {
      cacheManager.set(DRAFT_KEY, draft);
      if (!silent) Taro.showToast({ title: "已保存为草稿", icon: "success" });
    }
  };

  const clearDraft = () => cacheManager.remove(DRAFT_KEY);

  useLoad(() => {
    (async () => {
      try {
        const cats = await getBookCategories();
        setCategoryOptions((cats || []).filter((c) => c !== "全部"));
      } catch {}
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

  const validateIsbn = (raw) => {
    const cleaned = raw.replace(/-/g, "").trim();
    if (cleaned.length === 10) return /^\d{9}[\dXx]$/.test(cleaned);
    if (cleaned.length === 13) return /^\d{13}$/.test(cleaned);
    return false;
  };

  const fetchIsbnInfo = async (isbnCode) => {
    setIsbnFetching(true);
    const isH5 = process.env.TARO_ENV === "h5";
    const apiKey = process.env.ISBN_KEY || "";
    const apiUrl = `https://data.isbn.work/openApi/getInfoByIsbn?isbn=${encodeURIComponent(isbnCode)}&appKey=${encodeURIComponent(apiKey)}`;
    try {
      let json;
      if (isH5) {
        const fetchRes = await fetch(apiUrl);
        json = await fetchRes.json();
      } else {
        const res = await Taro.request({ url: apiUrl, method: "GET" });
        json = res.data;
      }
      if (!json) {
        Taro.showToast({ title: "查询失败，请重试", icon: "none" });
        return;
      }
      if (json.success && json.code === 0) {
        const d = json.data;
        setName(d.bookName || "");
        setAuthor(d.author || "");
        setPublisher(d.press || "");
        if (d.pictures) {
          let pics = [];
          try {
            pics = typeof d.pictures === "string" ? JSON.parse(d.pictures) : d.pictures;
          } catch { /* ignore */ }
          if (Array.isArray(pics) && pics.length > 0) {
            const coverUrls = pics.slice(0, 3).map((url) => ({ tempFilePath: url }));
            setImages(coverUrls);
          }
        }
        Taro.showToast({ title: "信息已填入", icon: "success" });
        setShowIsbnModal(false);
      } else {
        Taro.showToast({ title: json.msg || "查询失败", icon: "none" });
      }
    } catch (error) {
      runtimeLogger.error("BookBuy", "ISBN查询失败", error);
      Taro.showToast({ title: "查询失败，请重试", icon: "none" });
    } finally {
      setIsbnFetching(false);
    }
  };

  const handleScan = () => {
    Taro.scanCode({
      onlyFromCamera: true,
      scanType: ["barCode"],
      success: (res) => {
        const scanned = res.result;
        setIsbn(scanned);
        fetchIsbnInfo(scanned);
      },
      fail: (err) => {
        if (err.errMsg !== "scanCode:fail cancel") {
          Taro.showToast({ title: "扫码失败，请重试", icon: "none" });
        }
      },
    });
  };

  const handleManualSubmit = () => {
    const cleaned = isbnInput.replace(/-/g, "").trim();
    if (!cleaned) {
      Taro.showToast({ title: "请输入ISBN编码", icon: "none" });
      return;
    }
    if (!validateIsbn(cleaned)) {
      Taro.showToast({ title: "ISBN格式错误，请输入10位或13位数字", icon: "none" });
      return;
    }
    setIsbn(cleaned);
    fetchIsbnInfo(cleaned);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { Taro.showToast({ title: "请输入书籍名称", icon: "none" }); return; }
    if (!price.trim()) { Taro.showToast({ title: "请输入求购价", icon: "none" }); return; }
    if (!contact.trim()) { Taro.showToast({ title: "请输入联系方式", icon: "none" }); return; }
    if (submitting || uploading) return;

    setSubmitting(true);
    try {
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

      const data = {
        name: name.trim(),
        author: author.trim(),
        publisher: publisher.trim(),
        isbn: isbn.trim(),
        category,
        price: price.trim(),
        contact: contact.trim(),
        description: description.trim(),
        images: uploadedUrls,
        is_delivery: 0,
        book_type: 2,
      };

      await createBook(data);
      clearDraft();
      Taro.showToast({ title: "发布求购成功", icon: "success" });
      setTimeout(() => Taro.navigateBack(), 1500);
    } catch (error) {
      runtimeLogger.error("BookBuy", "发布失败", error);
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
          <HeadStatus text="发布求购" />
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
        <HeadStatus text="发布求购" />
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
                <Text className="upload-hint">上传参考图片</Text>
                <Text className="upload-sub">最多3张，点击选择</Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. 书籍名称 */}
        <View className="edit-section">
          <View className="field-label">书籍名称</View>
          <Input className="field-input" placeholder="请输入想要的书籍名称" value={name} onInput={(e) => setName(e.detail.value)} maxlength={100} />
        </View>

        {/* 2.5 作者 + 出版社 */}
        <View className="edit-section">
          <View className="field-row">
            <View className="flex-1">
              <View className="field-label">作者</View>
              <Input className="field-input" placeholder="选填" value={author} onInput={(e) => setAuthor(e.detail.value)} maxlength={50} />
            </View>
            <View className="flex-1">
              <View className="field-label">出版社</View>
              <Input className="field-input" placeholder="选填" value={publisher} onInput={(e) => setPublisher(e.detail.value)} maxlength={50} />
            </View>
          </View>
        </View>

        {/* 3. ISBN */}
        <View className="edit-section">
          <View className="field-label">ISBN</View>
          <View className="isbn-btn-row">
            <View className="isbn-btn isbn-btn-manual" onClick={() => { setIsbnInput(""); setShowIsbnModal(true); }}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color="#47a5fd" />
              <Text className="isbn-btn-text isbn-btn-text-manual">手动输入</Text>
            </View>
            <View className="isbn-btn isbn-btn-scan" onClick={handleScan}>
              <MaterialCommunityIcons name="barcode-scan" size={20} color="#fff" />
              <Text className="isbn-btn-text isbn-btn-text-scan">扫码获取</Text>
            </View>
          </View>
          {isbn ? (
            <View className="isbn-display">
              <Text className="isbn-display-text">ISBN: {isbn}</Text>
              <View className="isbn-clear" onClick={() => setIsbn("")}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
              </View>
            </View>
          ) : null}
        </View>

        {/* ISBN 手动输入模态框 */}
        {showIsbnModal && (
          <View className="isbn-modal-mask" onClick={() => setShowIsbnModal(false)}>
            <View className="isbn-modal" onClick={(e) => e.stopPropagation()}>
              <Text className="isbn-modal-title">请输入图书ISBN</Text>
              <Text className="isbn-modal-hint">请输入不含-符号的13位或10位ISBN编码</Text>
              <Input
                className="isbn-modal-input"
                placeholder="请输入ISBN"
                value={isbnInput}
                onInput={(e) => setIsbnInput(e.detail.value)}
                maxlength={20}
                focus
              />
              <View className="isbn-modal-btns">
                <View className="isbn-modal-cancel" onClick={() => setShowIsbnModal(false)}>
                  <Text className="isbn-modal-cancel-text">取消</Text>
                </View>
                <View
                  className={`isbn-modal-submit ${isbnFetching ? "isbn-modal-submit-disabled" : ""}`}
                  onClick={() => { if (!isbnFetching) handleManualSubmit(); }}
                >
                  <Text className="isbn-modal-submit-text">{isbnFetching ? "查询中..." : "提交"}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 4. 求购价 */}
        <View className="edit-section">
          <View className="field-label">求购价</View>
          <View className="field-row">
            <Text className="price-prefix">¥</Text>
            <Input className="field-input flex-1" type="digit" placeholder="请输入求购价" value={price} onInput={(e) => setPrice(e.detail.value)} />
          </View>
        </View>

        {/* 5. 种类 */}
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

        {/* 6. 联系方式 */}
        <View className="edit-section">
          <View className="field-label">联系方式</View>
          <Input className="field-input" placeholder="请输入微信号或手机号" value={contact} onInput={(e) => setContact(e.detail.value)} maxlength={50} />
          <Text className="field-hint">仅对登录用户可见</Text>
        </View>

        {/* 7. 详细描述 */}
        <View className="edit-section">
          <View className="field-label">求购说明</View>
          <Textarea
            className="field-textarea"
            placeholder="请描述你想要的具体版本、新旧程度等..."
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
          <Text className="publish-text">{uploading ? "上传中..." : submitting ? "发布中..." : "发布求购"}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
