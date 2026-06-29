import { useState, useEffect, useCallback } from "react";
import "./index.css";
import HeadStatus from "../../../components/layout/HeadStatus";
import SafeAreaView from "../../../components/base/SafeAreaView";
import { getContributor } from "../../../service/getContributor";
import { getRepos } from "../../../service/getRepos";
import { getLatestCommit } from "../../../service/getLatestCommit";
import { getHashCode } from "../../../utils/common/getHashCode";
import Taro, { usePullDownRefresh } from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import { AtIcon } from "taro-ui";

function hashToHsl(str) {
  const hue = getHashCode(str) % 360;
  return `hsl(${hue}, 55%, 60%)`;
}

function ContributorBar({ contributor, maxCommits, index }) {
  const { name, email, commits } = contributor;
  const barWidth = maxCommits > 0 ? (commits / maxCommits) * 100 : 0;
  const bgColor = hashToHsl(name);

  return (
    <View className="contributor-row">
      <Text className="contributor-rank">{index + 1}</Text>
      <View className="contributor-avatar" style={{ backgroundColor: bgColor }}>
        <Text className="contributor-avatar-text">{name.charAt(0)}</Text>
      </View>
      <View className="contributor-info">
        <View className="contributor-name-row">
          <View className="contributor-name-wrap">
            <Text className="contributor-name">{name}</Text>
            {email ? <Text className="contributor-email">{email}</Text> : null}
          </View>
          <Text className="contributor-commits">{commits} commits</Text>
        </View>
        <View className="bar-track bora">
          <View
            className="bar-fill bora"
            style={{
              width: `${barWidth}%`,
              backgroundColor: bgColor,
            }}
          />
        </View>
      </View>
    </View>
  );
}

export default function Index() {
  const [contributors, setContributors] = useState([]);
  const [contributorsCount, setContributorsCount] = useState(0);
  const [contributionsCount, setContributionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [latestCommit, setLatestCommit] = useState(null);
  const [latestCommitLoading, setLatestCommitLoading] = useState(true);

  const fetchContributors = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const data = await getContributor(force);
      if (data && data.contributors) {
        const sorted = [...data.contributors].sort((a, b) => b.commits - a.commits);
        setContributors(sorted);
        setContributorsCount(data.contributors_count);
        setContributionsCount(data.contributions);
      }
    } catch (err) {
      console.warn("获取贡献者失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRepos = useCallback(async (force = false) => {
    setReposLoading(true);
    try {
      const data = await getRepos(force);
      setRepos(data || []);
    } catch (err) {
      console.warn("获取仓库列表失败:", err);
    } finally {
      setReposLoading(false);
    }
  }, []);

  const fetchLatestCommit = useCallback(async (force = false) => {
    setLatestCommitLoading(true);
    try {
      const data = await getLatestCommit(force);
      setLatestCommit(data);
    } catch (err) {
      console.warn("获取最新提交失败:", err);
    } finally {
      setLatestCommitLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContributors();
    fetchRepos();
    fetchLatestCommit();
  }, [fetchContributors, fetchRepos, fetchLatestCommit]);

  usePullDownRefresh(() => {
    Promise.all([fetchContributors(true), fetchRepos(true), fetchLatestCommit(true)]).finally(() => {
      Taro.stopPullDownRefresh();
    });
  });

  const maxCommits = contributors.length > 0 ? contributors[0].commits : 0;

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.switchTab({ url: "/pages/user/index" })}
        />
        <HeadStatus text="项目仓库" />
      </View>
      <View className="repo-page-content">
        <View className="repo-info-card bora">
          <Text className="repo-name">taro_mini</Text>
          <View className="repo-url-row">
            <Text className="repo-url-label">仓库地址：</Text>
            <Text className="repo-url" onClick={() => {
              Taro.setClipboardData({ data: "https://gitee.com/damn_2/taro_mini" });
              Taro.showToast({ title: "已复制", icon: "none" });
            }}
            >
              https://gitee.com/damn_2/taro_mini
            </Text>
          </View>
          <Text className="repo-contributors-count">{contributorsCount} 位贡献者</Text>
          <Text className="repo-contributors-count">一共{contributionsCount} 次提交</Text>
          {latestCommitLoading ? (
            <View className="latest-commit-loading">
              <Text className="latest-commit-loading-text">加载最新提交...</Text>
            </View>
          ) : latestCommit ? (
            <View className="latest-commit-section">
              <Text className="latest-commit-label">最新提交</Text>
              <View className="latest-commit-info">
                <View className="latest-commit-row">
                  <Text className="latest-commit-field">提交人：</Text>
                  <Text className="latest-commit-value">{latestCommit.author}</Text>
                </View>
                <View className="latest-commit-row">
                  <Text className="latest-commit-field">时间：</Text>
                  <Text className="latest-commit-value">{latestCommit.date}</Text>
                </View>
                <View className="latest-commit-row">
                  <Text className="latest-commit-field">提交信息：</Text>
                  <Text className="latest-commit-value">{latestCommit.message}</Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>

        <View className="contributors-section bora">
          <Text className="section-title">贡献度排行</Text>
          {loading ? (
            <View className="loading-wrap">
              <Text className="loading-text">加载中...</Text>
            </View>
          ) : contributors.length === 0 ? (
            <View className="empty-wrap">
              <Text className="empty-text">暂无贡献数据</Text>
            </View>
          ) : (
            <View className="contributors-list">
              {contributors.map((item, index) => (
                <ContributorBar
                  key={item.name}
                  contributor={item}
                  maxCommits={maxCommits}
                  index={index}
                />
              ))}
            </View>
          )}
        </View>

        <View className="repos-section bora">
          <Text className="section-title">开源项目</Text>
          {reposLoading ? (
            <View className="loading-wrap">
              <Text className="loading-text">加载中...</Text>
            </View>
          ) : repos.length === 0 ? (
            <View className="empty-wrap">
              <Text className="empty-text">暂无仓库数据</Text>
            </View>
          ) : (
            <View className="repos-list">
              {repos.map((repo) => (
                <View key={repo.name} className="repo-item bora">
                  <View className="repo-item-icon">
                    <Text className="repo-item-icon-text">R</Text>
                  </View>
                  <View className="repo-item-info">
                    <Text className="repo-item-name">{repo.name}</Text>
                    <Text
                      className="repo-item-url"
                      onClick={() => {
                        Taro.setClipboardData({ data: repo.url });
                        Taro.showToast({ title: "已复制", icon: "none" });
                      }}
                    >
                      {repo.url}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
