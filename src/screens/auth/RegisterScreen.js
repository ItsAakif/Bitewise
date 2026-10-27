import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { colors, typography, space } from '../../theme';
import { signUpUser, loginWithGoogle, clearError } from '../../redux/slices/authSlice';
import { googleSignIn } from '../../services/auth';
import Input from '../../components/Input';
import Button from '../../components/Button';

const emailLooksValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error, mode } = useSelector((state) => state.auth);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);

  const emailError = touched && !emailLooksValid(email) ? 'Enter a valid email address.' : null;
  const passwordError = touched && password.length < 8 ? 'At least 8 characters.' : null;
  const confirmError = touched && confirm !== password ? 'Passwords do not match.' : null;
  const canSubmit =
    !loading && emailLooksValid(email) && password.length >= 8 && confirm === password;

  const submit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    dispatch(clearError());
    await dispatch(
      signUpUser({
        email: email.trim(),
        password,
        displayName: displayName.trim() || email.trim().split('@')[0],
      })
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[typography.title, styles.title]}>Create an account</Text>
          <Text style={[typography.body, styles.subtitle]}>
            {mode === 'local'
              ? 'This account lives on this device. Nothing is uploaded.'
              : 'Your profile is stored in the configured Firebase project.'}
          </Text>
        </View>

        <View style={styles.form}>
          <Input label="Name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" placeholder="Optional" />
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
          <Input
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat the password"
            secureTextEntry
            error={confirmError}
          />

          {error ? <Text style={[typography.caption, styles.error]}>{error}</Text> : null}

          <Button label="Create account" onPress={submit} loading={loading} disabled={!canSubmit} fullWidth />
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
          ) : null}

          <Button
            label="I already have an account"
            variant="ghost"
            onPress={() => {
              dispatch(clearError());
              navigation.navigate('Login');
            }}
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { flexGrow: 1, justifyContent: 'center', padding: space.base, gap: space.lg },
  header: { gap: space.sm },
  title: { color: colors.ink },
  subtitle: { color: colors.inkSecondary },
  form: { gap: space.base },
  error: { color: colors.danger },
});

export default RegisterScreen;
