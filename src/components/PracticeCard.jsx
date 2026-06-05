import { View, Text } from "@tarojs/components";
import "./PracticeCard.css";

export default function PracticeCard({ data }) {
  if (!data || data.length === 0) {
    return (
      <View className="practice-card">
        <View className="practice-empty">
          <Text>无</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="practice-card">
      {data.map((item, idx) => (
        <View key={idx} className="practice-item">
          <View className="practice-info">
            <Text className="practice-name">{item.kcmc}</Text>
            <Text className="practice-zjname">指导老师: {item.zjname}</Text>
          </View>
          <View className="practice-meta">
            <Text className="practice-weeks">周次: {item.zcstr}</Text>
            <Text className="practice-count">人数: {item.xkrs}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
