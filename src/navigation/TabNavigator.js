import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import TodayScreen from '../screens/TodayScreen';
import DiaryScreen from '../screens/DiaryScreen';
import FoodRecognitionScreen from '../screens/FoodRecognitionScreen';
import VirtualNutritionistScreen from '../screens/VirtualNutritionistScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Today: ['home-variant-outline', 'home-variant'],
  Diary: ['notebook-outline', 'notebook'],
  Scan: ['camera-outline', 'camera'],
  Coach: ['chat-processing-outline', 'chat-processing'],
  Profile: ['account-outline', 'account'],
};

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.inkTertiary,
      tabBarLabelStyle: typography.caption,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.line,
        borderTopWidth: 1,
      },
      tabBarIcon: ({ focused, color, size }) => {
        const pair = ICONS[route.name] || ['circle-outline', 'circle'];
        return <MaterialCommunityIcons name={pair[focused ? 1 : 0]} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Today" component={TodayScreen} />
    <Tab.Screen name="Diary" component={DiaryScreen} />
    <Tab.Screen name="Scan" component={FoodRecognitionScreen} />
    <Tab.Screen name="Coach" component={VirtualNutritionistScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default TabNavigator;
