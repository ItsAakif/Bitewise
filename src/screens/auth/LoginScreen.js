import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { colors, typography, space, radius } from '../../theme';
import { signInUser, loginWithGoogle, clearError } from '../../redux/slices/authSlice';
import { googleSignIn } from '../../services/auth';
import Input from '../../components/Input';
import Button from '../../components/Button';

const emailLooksValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error, mode } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const emailError = touched && !emailLooksValid(email) ? 'Enter a valid email address.' : null;
  const passwordError = touched && password.length < 8 ? 'At least 8 characters.' : null;
  const canSubmit = !loading && emailLooksValid(email) && password.length >= 8;

  const submit = async () => {
    setTouched(true);
    if (!emailLooksValid(email) || password.length < 8) return;
    dispatch(clearError());
    await dispatch(signInUser({ email: email.trim(), password }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[typography.display, styles.title]}>BiteWise</Text>
          <Text style={[typography.body, styles.subtitle]}>
            Sign in to pick up where you left off.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={emailError}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            error={passwordError}
          />

          {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

          <Button label="Sign in" onPress={submit} loading={loading} disabled={!canSubmit} fullWidth />

          {googleSignIn.available ? (
            <Button
              label="Continue with Google"
              variant="secondary"
              icon="google"
              onPress={() => {
                dispatch(clearError());
                dispatch(loginWithGoogle());
              }}
              disabled={loading}
              fullWidth
            />
          ) : mode === 'firebase' && googleSignIn.reason ? (
            <Text style={[typography.caption, styles.hint]}>{googleSignIn.reason}</Text>
          ) : null}

          <Button
            label="Create an account"
            variant="ghost"
            onPress={() => {
              dispatch(clearError());
              navigation.navigate('Register');
            }}
            fullWidth
          />
        </View>

        <Text style={[typography.caption, styles.mode]}>
          {mode === 'local'
            ? 'Local mode: your account and data stay on this device. No email is sent.'
            : 'Connected to the configured Firebase project.'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: space.base,
    gap: space.xl,
  },
  header: { gap: space.sm },
  title: { color: colors.ink },
  subtitle: { color: colors.inkSecondary },
  form: { gap: space.base },
  error: { color: colors.danger },
  hint: { color: colors.inkTertiary },
  mode: {
    color: colors.inkTertiary,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: space.base,
    borderRadius: radius.sm,
  },
});

export default LoginScreen;
