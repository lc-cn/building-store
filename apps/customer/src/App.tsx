/**
 * Building Store 应用端
 * 在线购物平台 React Native App
 */

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

function App(): JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>建材商店</Text>
          <Text style={styles.subtitle}>Building Store</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.description}>
            在线购物平台，面向终端消费者
          </Text>
          <View style={styles.features}>
            <Text style={styles.featureTitle}>主要功能模块：</Text>
            <Text style={styles.feature}>• 首页 - 轮播广告和热门推荐</Text>
            <Text style={styles.feature}>• 商品 - 分类浏览和详情查看</Text>
            <Text style={styles.feature}>• 搜索 - 关键词搜索和筛选</Text>
            <Text style={styles.feature}>• 购物车 - 商品管理和结算</Text>
            <Text style={styles.feature}>• 订单 - 下单、支付和跟踪</Text>
            <Text style={styles.feature}>• 用户中心 - 个人信息和设置</Text>
            <Text style={styles.feature}>• 支付 - 多种支付方式</Text>
            <Text style={styles.feature}>• 营销 - 优惠券和活动</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#52c41a',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  features: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default App;
