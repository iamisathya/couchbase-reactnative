import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

export default function FeaturesScreen() {
  const features = [
    {
      icon: '🎲',
      title: 'Random Post Fetching',
      description: 'Get random posts from JSON Placeholder API with a single tap'
    },
    {
      icon: '💾',
      title: 'Couchbase Storage',
      description: 'Store posts locally in Couchbase Lite database for offline access'
    },
    {
      icon: '☁️',
      title: 'Capella Cloud Sync',
      description: 'Automatic synchronization with Couchbase Capella cloud database'
    },
    {
      icon: '🔄',
      title: 'Live Sync',
      description: 'Real-time bidirectional sync between local and cloud databases'
    },
    {
      icon: '📱',
      title: 'Offline Support',
      description: 'Works seamlessly offline with automatic sync when online'
    },
    {
      icon: '📋',
      title: 'Post Management',
      description: 'View, edit, and delete posts with intuitive interface'
    },
    {
      icon: '⚡',
      title: 'High Performance',
      description: 'Built with React Native and optimized for smooth performance'
    },
    {
      icon: '🔒',
      title: 'Secure Sync',
      description: 'Authenticated sync with your Capella App Service endpoint'
    }
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>✨ Features</Text>
            <Text style={styles.headerSubtitle}>Everything this app can do</Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Text style={styles.iconText}>{feature.icon}</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Tech Stack */}
          <View style={styles.techStackContainer}>
            <Text style={styles.sectionTitle}>🛠️ Built With</Text>
            <View style={styles.techStack}>
              <View style={styles.techItem}>
                <Text style={styles.techIcon}>⚛️</Text>
                <Text style={styles.techName}>React Native</Text>
              </View>
              <View style={styles.techItem}>
                <Text style={styles.techIcon}>🗄️</Text>
                <Text style={styles.techName}>Couchbase Lite</Text>
              </View>
              <View style={styles.techItem}>
                <Text style={styles.techIcon}>☁️</Text>
                <Text style={styles.techName}>Couchbase Capella</Text>
              </View>
              <View style={styles.techItem}>
                <Text style={styles.techIcon}>🔄</Text>
                <Text style={styles.techName}>Sync Gateway</Text>
              </View>
            </View>
          </View>

          {/* Made with Love */}
          <View style={styles.loveContainer}>
            <Text style={styles.loveText}>Made with 💖 by</Text>
            <Text style={styles.authorName}>Sathya</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  techStackContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  techStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  techItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  techIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  techName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  loveContainer: {
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  loveIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loveText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  authorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  loveSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
