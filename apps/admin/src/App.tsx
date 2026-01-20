/**
 * Building Store 管理端
 * 后台管理系统 React Native App
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
          <Text style={styles.title}>建材商店管理端</Text>
          <Text style={styles.subtitle}>Building Store Admin</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.description}>
            后台管理系统，面向商家和管理员
          </Text>
          <View style={styles.features}>
            <Text style={styles.featureTitle}>主要功能模块：</Text>
            <Text style={styles.feature}>• 仪表盘 - 数据概览和统计</Text>
            <Text style={styles.feature}>• 商品管理 - 商品CRUD操作</Text>
            <Text style={styles.feature}>• 订单管理 - 订单处理和跟踪</Text>
            <Text style={styles.feature}>• 用户管理 - 用户信息和权限</Text>
            <Text style={styles.feature}>• 库存管理 - 库存查询和调整</Text>
            <Text style={styles.feature}>• 营销管理 - 优惠券和活动</Text>
            <Text style={styles.feature}>• 财务管理 - 交易和报表</Text>
            <Text style={styles.feature}>• 系统设置 - 配置和权限</Text>
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
    backgroundColor: '#1890ff',
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
