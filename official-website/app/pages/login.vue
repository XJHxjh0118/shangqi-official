<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const localePath = useLocalePath()
const { login, authErrorMessage } = useAuth()

const form = reactive({ email: '', password: '' })
const submitting = ref(false)
const error = ref('')

async function onSubmit() {
  if (submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    await login(form.email, form.password)
    await navigateTo(localePath('/account'))
  } catch (err) {
    error.value = authErrorMessage(err)
  } finally {
    submitting.value = false
  }
}

useSeoGeo({
  title: t('auth.loginTitle'),
  description: t('auth.loginDesc'),
})
</script>

<template>
  <div class="page">
    <div class="auth-panel">
      <h1>{{ t('auth.loginTitle') }}</h1>
      <p>{{ t('auth.loginDesc') }}</p>
      <el-form label-position="top" @submit.prevent="onSubmit">
        <el-form-item :label="t('auth.email')">
          <el-input v-model="form.email" type="email" autocomplete="username" />
        </el-form-item>
        <el-form-item :label="t('auth.password')">
          <el-input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            show-password
          />
        </el-form-item>
        <p v-if="error" class="notice err">{{ error }}</p>
        <el-button type="primary" native-type="submit" :loading="submitting">
          {{ t('auth.login') }}
        </el-button>
      </el-form>
      <div class="auth-links">
        <NuxtLink :to="localePath('/register')">{{ t('auth.goRegister') }}</NuxtLink>
        <NuxtLink :to="localePath('/forgot-password')">{{ t('auth.forgot') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>
