<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'

definePageMeta({
  middleware: 'guest',
})

const { t } = useI18n()
const localePath = useLocalePath()
const { register, authErrorMessage } = useAuth()

const formRef = ref<FormInstance>()
const form = reactive({
  email: '',
  password: '',
  company: '',
  contactName: '',
  phone: '',
  region: '',
  address: '',
})
const submitting = ref(false)
const error = ref('')
const done = ref(false)

const rules = computed<FormRules>(() => ({
  email: [
    { required: true, message: t('auth.email'), trigger: 'blur' },
    { type: 'email', message: t('auth.email'), trigger: 'blur' },
  ],
  password: [{ required: true, min: 6, message: t('auth.password'), trigger: 'blur' }],
  company: [{ required: true, message: t('auth.company'), trigger: 'blur' }],
  contactName: [{ required: true, message: t('auth.contact'), trigger: 'blur' }],
}))

async function onSubmit() {
  if (submitting.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  error.value = ''
  try {
    await register({ ...form })
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
  <div class="page">
    <div class="auth-panel">
      <h1>{{ t('auth.registerTitle') }}</h1>
      <p>{{ t('auth.registerDesc') }}</p>
      <p v-if="done" class="notice ok">{{ t('auth.registerPending') }}</p>
      <el-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item :label="t('auth.email')" prop="email">
          <el-input v-model="form.email" type="email" />
        </el-form-item>
        <el-form-item :label="t('auth.password')" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item :label="t('auth.company')" prop="company">
          <el-input v-model="form.company" />
        </el-form-item>
        <el-form-item :label="t('auth.contact')" prop="contactName">
          <el-input v-model="form.contactName" />
        </el-form-item>
        <el-form-item :label="t('auth.phone')">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item :label="t('auth.region')">
          <el-input v-model="form.region" />
        </el-form-item>
        <el-form-item :label="t('auth.address')">
          <el-input v-model="form.address" />
        </el-form-item>
        <p v-if="error" class="notice err">{{ error }}</p>
        <el-button type="primary" native-type="submit" :loading="submitting">
          {{ t('auth.register') }}
        </el-button>
      </el-form>
      <div class="auth-links">
        <NuxtLink :to="localePath('/login')">{{ t('auth.goLogin') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>
