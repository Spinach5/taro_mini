import { View, Text, Input, Textarea, ScrollView, Image } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
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
  deleteBookImage,
} from "../../../../service";
import runtimeLogger from "../../../../utils/runtimeLogger";
import "./index.css";

const CONDITION_OPTIONS = ["全新", "几乎全新", "有笔记", "较旧"];

export default function Index() {
  const router = Taro.useRouter();
  const editId = router.params.id || "";

  const [name, setName] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("全新");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]); // [{ url, imageId }]
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showCondPicker, setShowCondPicker] = useState(false);

  const isEdit = !!editId;

  useLoad(() => {
    (async () => {
      // 获取分类
      try {
        const cats = await getBookCategories();
        // 去掉"全部"，只保留实际分类
        setCategoryOptions(
          (cats || []).filter((c) => c !== "全部"),
        );
      } catch {
        // 分类加载失败不阻塞
      }

      // 编辑模式预填
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
            setImages(data.images || []);
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
      success: async (res) => {
        setUploading(true);
        for (const filePath of res.tempFilePaths) {
          try {
            const result = await uploadBookImage(filePath);
            if (result && result.url) {
              setImages((prev) => [
                ...prev,
                { url: result.url, imageId: result.imageId },
              ]);
            }
          } catch {
            Taro.showToast({ title: "图片上传失败", icon: "none" });
          }
        }
        setUploading(false);
      },
    });
  };

  const handleDeleteImage = async (index) => {
    const img = images[index];
    try {
      await deleteBookImage(isEdit ? editId : null, img.imageId);
      setImages((prev) => prev.filter((_, i) => i !== index));
    } catch {
      Taro.showToast({ title: "删除失败", icon: "none" });
    }
  };

  const canSubmit =
    name.trim() && isbn.trim() && category && price.trim();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    const data = {
      name: name.trim(),
      isbn: isbn.trim(),
      category,
      price: price.trim(),
      condition,
      description: description.trim(),
      images,
    };

    setSubmitting(true);
    try {
      const res = isEdit
        ? await updateBook(editId, data)
        : await createBook(data);

      if (res && res.success) {
        Taro.showToast({ title: isEdit ? "更新成功" : "发布成功", icon: "success" });
        setTimeout(() => Taro.navigateBack(), 1500);
      } else {
        Taro.showToast({
          title: (res && res.message) || "操作失败",
          icon: "none",
        });
      }
    } catch (error) {
      runtimeLogger.error("BookEdit", "提交书籍失败", error);
      Taro.showToast({
        title: error.message || "提交失败，请稍后重试",
        icon: "none",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!fetched) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <AtIcon
            value="arrow-left"
            color="#ffffff"
            onClick={() => Taro.navigateBack()}
          />
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
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.navigateBack()}
        />
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
              onInput={(e) => setName(e.detail.value)}
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
              onInput={(e) => setIsbn(e.detail.value)}
              maxlength={50}
            />
          </View>
        </View>

        {/* 种类 */}
        <View className="form-group">
          <Text className="form-label">种类 *</Text>
          <View
            className="form-picker"
            onClick={() => setShowCatPicker(!showCatPicker)}
          >
            <Text className={`picker-value ${!category ? "picker-placeholder" : ""}`}>
              {category || "请选择种类"}
            </Text>
            <AtIcon
              value={showCatPicker ? "chevron-up" : "chevron-down"}
              size={16}
              color="#999"
            />
          </View>
          {showCatPicker && (
            <View className="picker-options">
              {categoryOptions.map((cat) => (
                <View
                  key={cat}
                  className={`picker-option ${category === cat ? "picker-option-active" : ""}`}
                  onClick={() => {
                    setCategory(cat);
                    setShowCatPicker(false);
                  }}
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
              onInput={(e) => setPrice(e.detail.value)}
            />
          </View>
        </View>

        {/* 新旧程度 */}
        <View className="form-group">
          <Text className="form-label">新旧程度</Text>
          <View
            className="form-picker"
            onClick={() => setShowCondPicker(!showCondPicker)}
          >
            <Text className="picker-value">{condition}</Text>
            <AtIcon
              value={showCondPicker ? "chevron-up" : "chevron-down"}
              size={16}
              color="#999"
            />
          </View>
          {showCondPicker && (
            <View className="picker-options">
              {CONDITION_OPTIONS.map((opt) => (
                <View
                  key={opt}
                  className={`picker-option ${condition === opt ? "picker-option-active" : ""}`}
                  onClick={() => {
                    setCondition(opt);
                    setShowCondPicker(false);
                  }}
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
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
            autoHeight
          />
        </View>

        {/* 图片区 */}
        <View className="form-group">
          <Text className="form-label">图片（最多3张）</Text>
          <View className="image-grid">
            {images.map((img, idx) => (
              <View key={idx} className="image-item">
                <Image
                  className="image-thumb"
                  src={img.url}
                  mode="aspectFill"
                />
                <View
                  className="image-delete"
                  onClick={() => handleDeleteImage(idx)}
                >
                  <Text className="image-delete-icon">×</Text>
                </View>
              </View>
            ))}
            {images.length < 3 && !uploading && (
              <View className="image-add" onClick={handleChooseImage}>
                <Text className="image-add-icon">+</Text>
              </View>
            )}
            {uploading && (
              <View className="image-add image-uploading">
                <AtActivityIndicator isOpened size={24} mode="center" />
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
              {submitting ? "提交中..." : isEdit ? "保存修改" : "发布"}
            </Text>
          </View>
        </View>

        <View style={{ height: "60rpx" }} />
      </ScrollView>
    </SafeAreaView>
  );
}
