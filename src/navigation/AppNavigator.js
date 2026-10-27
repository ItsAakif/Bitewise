import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { navigationTheme } from '../theme';
import TabNavigator from './TabNavigator';
import AuthNavigator from './AuthNavigator';
import MealEntryScreen from '../screens/MealEntryScreen';
import FoodSearchScreen from '../screens/FoodSearchScreen';
import RecipesScreen from '../screens/RecipesScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import RecipeCustomizationScreen from '../screens/RecipeCustomizationScreen';
import MealPlanningScreen from '../screens/MealPlanningScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import StatsScreen from '../screens/StatsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SupportScreen from '../screens/SupportScreen';
import AboutScreen from '../screens/AboutScreen';
import LegalScreen from '../screens/LegalScreen';
import NutrientsScreen from '../screens/NutrientsScreen';
import DataScreen from '../screens/DataScreen';
import BarcodeScanScreen from '../screens/BarcodeScanScreen';
import RecipeImportScreen from '../screens/RecipeImportScreen';
import LabelEntryScreen from '../screens/LabelEntryScreen';
import ModelPickerScreen from '../screens/ModelPickerScreen';
import FoodEditScreen from '../screens/FoodEditScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import InsightsScreen from '../screens/InsightsScreen';

const Stack = createNativeStackNavigator();

// Every screen draws its own header through ScreenScaffold, so the navigator
// header is off everywhere. That is what keeps twenty screens visually identical
// at the top instead of twenty slightly different native headers.
const screenOptions = { headerShown: false };

const AppNavigator = () => {
  const { user, status } = useSelector((state) => state.auth);

  if (status === 'unknown') return null;

  return (
    <NavigationContainer theme={navigationTheme}>
      {!user ? (
        <AuthNavigator />
      ) : (
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="MealEntry" component={MealEntryScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="FoodSearch" component={FoodSearchScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Recipes" component={RecipesScreen} />
          <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
          <Stack.Screen name="RecipeCustomization" component={RecipeCustomizationScreen} />
          <Stack.Screen name="MealPlanning" component={MealPlanningScreen} />
          <Stack.Screen name="Workouts" component={WorkoutsScreen} />
          <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
          <Stack.Screen name="Stats" component={StatsScreen} />
          <Stack.Screen name="Goals" component={GoalsScreen} />
          <Stack.Screen name="Community" component={CommunityScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Support" component={SupportScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Legal" component={LegalScreen} />
          <Stack.Screen name="Nutrients" component={NutrientsScreen} />
          <Stack.Screen name="Data" component={DataScreen} />
          <Stack.Screen name="BarcodeScan" component={BarcodeScanScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="RecipeImport" component={RecipeImportScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="LabelEntry" component={LabelEntryScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="ModelPicker" component={ModelPickerScreen} />
          <Stack.Screen name="FoodEdit" component={FoodEditScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="ShoppingList" component={ShoppingListScreen} />
          <Stack.Screen name="Insights" component={InsightsScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
