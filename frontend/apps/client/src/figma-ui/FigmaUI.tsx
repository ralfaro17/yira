import React from 'react';
import { Routes, Route } from 'react-router';
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import {
  SignupType,
  ProfileScreen,
  AccountScreen,
  ExperienceScreen,
  BusinessScreen,
  HealthScreen,
  DoneScreen,
} from './screens/SignupScreens';
import { RecoveryScreen } from './screens/RecoveryScreen';
import { MembershipsScreen } from './screens/MembershipsScreen';
import './figma-ui.css';

export const FigmaUI: React.FC = () => {
  return (
    <Routes>
      <Route index element={<HomeScreen />} />
      <Route path="memberships" element={<MembershipsScreen />} />
      <Route path="login" element={<LoginScreen />} />
      <Route path="signup" element={<SignupType />} />
      <Route path="signup/profile" element={<ProfileScreen />} />
      <Route path="signup/account" element={<AccountScreen />} />
      <Route path="signup/experience" element={<ExperienceScreen />} />
      <Route path="signup/business" element={<BusinessScreen />} />
      <Route path="signup/health" element={<HealthScreen />} />
      <Route path="signup/done" element={<DoneScreen />} />
      <Route path="forgot-password" element={<RecoveryScreen step="email" />} />
      <Route path="forgot-password/code" element={<RecoveryScreen step="code" />} />
      <Route path="reset-password" element={<RecoveryScreen step="reset" />} />
      <Route path="recovery" element={<RecoveryScreen step="email" />} />
      <Route path="recovery/code" element={<RecoveryScreen step="code" />} />
      <Route path="recovery/reset" element={<RecoveryScreen step="reset" />} />
      <Route path="*" element={<HomeScreen />} />
    </Routes>
  );
};
