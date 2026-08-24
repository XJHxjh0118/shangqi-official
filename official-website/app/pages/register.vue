<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { DEALER_REGIONS } from '~/data/regions'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { register, authErrorMessage } = useAuth()

const formRef = ref<FormInstance>()
const form = reactive({
  company: '',
  contactName: '',
  email: '',
  region: '',
  regionalManager: '',
  phone: '',
  password: '',
  passwordConfirm: '',
})
const submitting = ref(false)
const error = ref('')
const done = ref(false)

const regionOptions = computed(() =>
  DEALER_REGIONS.map((item) => ({
    value: item.value,
    label: locale.value === 'en' ? item.en : item.zh,
  })),
)

const rules = computed<FormRules>(() => ({
  company: [{ required: true, message: t('auth.company'), trigger: 'blur' }],
  contactName: [{ required: true, message: t('auth.contact'), trigger: 'blur' }],
  email: [
    { required: true, message: t('auth.email'), trigger: 'blur' },
    { type: 'email', message: t('auth.email'), trigger: 'blur' },
  ],
  region: [{ required: true, message: t('auth.region'), trigger: 'change' }],
  regionalManager: [
    { required: true, message: t('auth.manager'), trigger: 'blur' },
  ],
  password: [
    { required: true, min: 6, message: t('auth.passwordMin'), trigger: 'blur' },
  ],
  passwordConfirm: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error(t('auth.passwordConfirm')))
          return
        }
        if (value !== form.password) {
          callback(new Error(t('auth.passwordMismatch')))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}))

async function onSubmit() {
  if (submitting.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  error.value = ''
  try {
    await register({
      company: form.company,
      contactName: form.contactName,
      email: form.email,
      region: form.region,
      regionalManager: form.regionalManager,
      phone: form.phone || undefined,
      password: form.password,
    })
    done.value = true
  } catch (err) {
    error.value = authErrorMessage(err)
  } finally {
    submitting.value = false
  }
}

useSeoGeo({
  title: t('auth.registerTitle'),
  description: t('auth.registerDesc'),
})
</script>

<template>
  <div class="page page-auth">
    <AuthShell>
      <h1>{{ t('auth.registerTitle') }}</h1>
      <p>{{ t('auth.registerDesc') }}</p>
      <p v-if="done" class="notice ok">
        {{ t('auth.registerPending') }}
      </p>
      <el-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="auth-form-grid"
        @submit.prevent="onSubmit"
      >
        <el-form-item :label="t('auth.company')" prop="company">
          <el-input v-model="form.company" autocomplete="organization" />
        </el-form-item>
        <el-form-item :label="t('auth.contact')" prop="contactName">
          <el-input v-model="form.contactName" autocomplete="name" />
        </el-form-item>
        <el-form-item :label="t('auth.email')" prop="email">
          <el-input v-model="form.email" type="email" autocomplete="email" />
        </el-form-item>
        <el-form-item :label="t('auth.region')" prop="region">
          <el-select
            v-model="form.region"
            :placeholder="t('auth.regionPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="item in regionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('auth.manager')" prop="regionalManager">
          <el-input v-model="form.regionalManager" />
        </el-form-item>
        <el-form-item :label="t('auth.phone')">
          <el-input v-model="form.phone" autocomplete="tel" />
        </el-form-item>
        <el-form-item :label="t('auth.password')" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            show-password
          />
        </el-form-item>
        <el-form-item :label="t('auth.passwordConfirm')" prop="passwordConfirm">
          <el-input
            v-model="form.passwordConfirm"
            type="password"
            autocomplete="new-password"
            show-password
          />
        </el-form-item>
        <div class="auth-form-actions">
          <p v-if="error" class="notice err" role="alert">{{ error }}</p>
          <el-button
            type="primary"
            native-type="submit"
            :loading="submitting"
          >
            {{ t('auth.register') }}
          </el-button>
        </div>
      </el-form>
      <div class="auth-links">
        <NuxtLink :to="localePath('/login')">{{ t('auth.goLogin') }}</NuxtLink>
      </div>
    </AuthShell>
  </div>
</template>
