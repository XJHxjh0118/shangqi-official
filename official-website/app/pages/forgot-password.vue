<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'

definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

const { t } = useI18n()
const localePath = useLocalePath()
const { sendResetCode, resetPassword } = useApi()
const { authErrorMessage } = useAuth()

type Step = 'account' | 'verify' | 'password' | 'done'

const formRef = ref<FormInstance>()
const step = ref<Step>('account')
const form = reactive({
  account: '',
  code: '',
  password: '',
  passwordConfirm: '',
})
const submitting = ref(false)
const error = ref('')
const hint = ref('')
const cooldown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const steps = computed(() => [
  { key: 'account', label: t('auth.account') },
  { key: 'verify', label: t('auth.verifyIdentity') },
  { key: 'password', label: t('auth.setPassword') },
])

const rules = computed<FormRules>(() => {
  if (step.value === 'account') {
    return {
      account: [{ required: true, message: t('auth.account'), trigger: 'blur' }],
    }
  }
  if (step.value === 'verify') {
    return {
      code: [{ required: true, min: 4, message: t('auth.code'), trigger: 'blur' }],
    }
  }
  return {
    password: [
      { required: true, min: 6, message: t('auth.passwordMin'), trigger: 'blur' },
    ],
    passwordConfirm: [
      {
        required: true,
        validator: (_rule, value, callback) => {
          if (value !== form.password) {
            callback(new Error(t('auth.passwordMismatch')))
            return
          }
          callback()
        },
        trigger: 'blur',
      },
    ],
  }
})

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startCooldown() {
  cooldown.value = 60
  clearTimer()
  timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) clearTimer()
  }, 1000)
}

onUnmounted(clearTimer)

async function onSendCode() {
  if (submitting.value || cooldown.value > 0) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  error.value = ''
  try {
    const res = await sendResetCode(form.account)
    hint.value = t('auth.codeSent', { target: res.masked || form.account })
    if (res.devCode) {
      hint.value = `${hint.value} ${t('auth.devCode', { code: res.devCode })}`
    }
    startCooldown()
    step.value = 'verify'
  } catch (err) {
    error.value = authErrorMessage(err)
  } finally {
    submitting.value = false
  }
}

async function onVerify() {
  if (submitting.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  step.value = 'password'
  error.value = ''
}

async function onReset() {
  if (submitting.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  error.value = ''
  try {
    await resetPassword({
      account: form.account,
      code: form.code,
      password: form.password,
    })
    step.value = 'done'
    setTimeout(() => {
      navigateTo(localePath('/login'))
    }, 1600)
  } catch (err) {
    error.value = authErrorMessage(err)
  } finally {
    submitting.value = false
  }
}

function onBack() {
  error.value = ''
  if (step.value === 'verify') step.value = 'account'
  if (step.value === 'password') step.value = 'verify'
}

useSeoGeo({
  title: t('auth.forgotTitle'),
  description: t('auth.forgotDesc'),
})
</script>

<template>
  <div class="page page-auth">
    <AuthShell>
      <h1>{{ t('auth.forgotTitle') }}</h1>
      <p>{{ t('auth.forgotDesc') }}</p>

      <ol class="auth-steps" aria-label="progress">
        <li
          v-for="item in steps"
          :key="item.key"
          :data-current="step === item.key || (step === 'done' && item.key === 'password')"
        >
          {{ item.label }}
        </li>
      </ol>

      <p v-if="step === 'done'" class="notice ok">{{ t('auth.resetOk') }}</p>

      <el-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent
      >
        <template v-if="step === 'account'">
          <el-form-item :label="t('auth.account')" prop="account">
            <el-input
              v-model="form.account"
              autocomplete="username"
              @keyup.enter="onSendCode"
            />
          </el-form-item>
          <p v-if="error" class="notice err" role="alert">{{ error }}</p>
          <el-button
            type="primary"
            :loading="submitting"
            @click="onSendCode"
          >
            {{ t('auth.getCode') }}
          </el-button>
        </template>

        <template v-else-if="step === 'verify'">
          <p v-if="hint" class="notice">{{ hint }}</p>
          <el-form-item :label="t('auth.code')" prop="code">
            <el-input
              v-model="form.code"
              inputmode="numeric"
              autocomplete="one-time-code"
              @keyup.enter="onVerify"
            />
          </el-form-item>
          <p v-if="error" class="notice err" role="alert">{{ error }}</p>
          <div class="auth-actions">
            <el-button native-type="button" @click="onBack">
              {{ t('auth.back') }}
            </el-button>
            <el-button
              type="primary"
              :disabled="cooldown > 0 && !form.code"
              @click="onVerify"
            >
              {{ t('auth.verifyIdentity') }}
            </el-button>
          </div>
          <button
            class="auth-text-btn"
            type="button"
            :disabled="cooldown > 0 || submitting"
            @click="onSendCode"
          >
            {{
              cooldown > 0
                ? t('auth.resendIn', { n: cooldown })
                : t('auth.getCode')
            }}
          </button>
        </template>

        <template v-else>
          <el-form-item :label="t('auth.newPassword')" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              show-password
            />
          </el-form-item>
          <el-form-item
            :label="t('auth.passwordConfirm')"
            prop="passwordConfirm"
          >
            <el-input
              v-model="form.passwordConfirm"
              type="password"
              autocomplete="new-password"
              show-password
            />
          </el-form-item>
          <p v-if="error" class="notice err" role="alert">{{ error }}</p>
          <div class="auth-actions">
            <el-button native-type="button" @click="onBack">
              {{ t('auth.back') }}
            </el-button>
            <el-button
              type="primary"
              :loading="submitting"
              @click="onReset"
            >
              {{ t('auth.resetSubmit') }}
            </el-button>
          </div>
        </template>
      </el-form>

      <div class="auth-links">
        <NuxtLink :to="localePath('/login')">{{ t('auth.goLogin') }}</NuxtLink>
      </div>
    </AuthShell>
  </div>
</template>
