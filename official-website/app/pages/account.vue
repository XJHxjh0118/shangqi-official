<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { regionLabel } from '~/data/regions'

definePageMeta({
  middleware: 'auth',
  ssr: false,
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { profile, fetchProfile, logout, authErrorMessage } = useAuth()
const { updateProfile, changePassword } = useApi()
const { count } = useInquiryList()
const { items: favs } = useFavorites()

const profileRef = ref<FormInstance>()
const passwordRef = ref<FormInstance>()
const profileForm = reactive({
  contactName: '',
  email: '',
  phone: '',
  address: '',
})
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  passwordConfirm: '',
})
const profileSaving = ref(false)
const passwordSaving = ref(false)
const profileError = ref('')
const passwordError = ref('')
const profileOk = ref('')
const passwordOk = ref('')

const statusText = computed(() => {
  const status = profile.value?.status
  if (status === 'PENDING') return t('account.statusPending')
  if (status === 'REJECTED') return t('account.statusRejected')
  if (status === 'APPROVED') return t('account.statusApproved')
  return status || '—'
})

const regionText = computed(() =>
  regionLabel(profile.value?.region, locale.value) || profile.value?.region || '—',
)

const profileRules = computed<FormRules>(() => ({
  contactName: [{ required: true, message: t('auth.contact'), trigger: 'blur' }],
  email: [
    { required: true, message: t('auth.email'), trigger: 'blur' },
    { type: 'email', message: t('auth.email'), trigger: 'blur' },
  ],
}))

const passwordRules = computed<FormRules>(() => ({
  currentPassword: [
    { required: true, message: t('auth.currentPassword'), trigger: 'blur' },
  ],
  newPassword: [
    { required: true, min: 6, message: t('auth.passwordMin'), trigger: 'blur' },
  ],
  passwordConfirm: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error(t('auth.passwordMismatch')))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}))

function fillProfile() {
  profileForm.contactName = profile.value?.contactName || profile.value?.nickname || ''
  profileForm.email = profile.value?.email || profile.value?.username || ''
  profileForm.phone = profile.value?.phone || ''
  profileForm.address = profile.value?.address || ''
}

onMounted(async () => {
  try {
    await fetchProfile()
  } catch {
    // middleware handles expired sessions
  }
  fillProfile()
})

watch(
  () => profile.value?.id,
  () => fillProfile(),
)

async function onSaveProfile() {
  if (profileSaving.value) return
  const valid = await profileRef.value?.validate().catch(() => false)
  if (!valid) return
  profileSaving.value = true
  profileError.value = ''
  profileOk.value = ''
  try {
    const next = await updateProfile({
      contactName: profileForm.contactName,
      email: profileForm.email,
      phone: profileForm.phone,
      address: profileForm.address,
    })
    profile.value = next
    profileOk.value = t('account.profileSaved')
  } catch (err) {
    profileError.value = authErrorMessage(err)
  } finally {
    profileSaving.value = false
  }
}

async function onSavePassword() {
  if (passwordSaving.value) return
  const valid = await passwordRef.value?.validate().catch(() => false)
  if (!valid) return
  passwordSaving.value = true
  passwordError.value = ''
  passwordOk.value = ''
  try {
    await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordOk.value = t('account.passwordSaved')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.passwordConfirm = ''
    passwordRef.value?.resetFields()
  } catch (err) {
    passwordError.value = authErrorMessage(err)
  } finally {
    passwordSaving.value = false
  }
}

function onLogout() {
  logout()
  navigateTo(localePath('/login'))
}

useSeoGeo({
  title: t('account.title'),
  description: t('account.desc'),
})
</script>

<template>
  <div class="page">
    <div class="container account-page">
      <header class="page-head">
        <h1>{{ t('account.title') }}</h1>
        <p>{{ t('account.desc') }}</p>
      </header>

      <div class="account-layout">
        <section class="account-aside">
          <h2>{{ t('account.readonly') }}</h2>
          <dl class="account-meta">
            <div>
              <dt>{{ t('auth.company') }}</dt>
              <dd>{{ profile?.company || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('auth.region') }}</dt>
              <dd>{{ regionText }}</dd>
            </div>
            <div>
              <dt>{{ t('auth.manager') }}</dt>
              <dd>{{ profile?.regionalManager || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('account.status') }}</dt>
              <dd>{{ statusText }}</dd>
            </div>
          </dl>
          <p class="account-links">
            <NuxtLink :to="localePath('/inquiry')">
              {{ t('account.inquiryCount', { n: count }) }}
            </NuxtLink>
            <NuxtLink :to="localePath('/favorites')">
              {{ t('nav.favorites') }} ({{ favs.length }})
            </NuxtLink>
          </p>
          <button class="btn btn-ghost" type="button" @click="onLogout">
            {{ t('auth.logout') }}
          </button>
        </section>

        <div class="account-main">
          <section>
            <h2>{{ t('account.profile') }}</h2>
            <el-form
              ref="profileRef"
              :model="profileForm"
              :rules="profileRules"
              label-position="top"
              class="account-form"
              @submit.prevent="onSaveProfile"
            >
              <el-form-item :label="t('auth.contact')" prop="contactName">
                <el-input v-model="profileForm.contactName" />
              </el-form-item>
              <el-form-item :label="t('auth.email')" prop="email">
                <el-input v-model="profileForm.email" type="email" />
              </el-form-item>
              <el-form-item :label="t('auth.phone')">
                <el-input v-model="profileForm.phone" />
              </el-form-item>
              <el-form-item :label="t('auth.address')">
                <el-input v-model="profileForm.address" />
              </el-form-item>
              <p v-if="profileError" class="notice err" role="alert">
                {{ profileError }}
              </p>
              <p v-if="profileOk" class="notice ok">{{ profileOk }}</p>
              <el-button
                type="primary"
                native-type="submit"
                :loading="profileSaving"
              >
                {{ t('account.saveProfile') }}
              </el-button>
            </el-form>
          </section>

          <section>
            <h2>{{ t('account.security') }}</h2>
            <el-form
              ref="passwordRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-position="top"
              class="account-form"
              @submit.prevent="onSavePassword"
            >
              <el-form-item
                :label="t('auth.currentPassword')"
                prop="currentPassword"
              >
                <el-input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  autocomplete="current-password"
                  show-password
                />
              </el-form-item>
              <el-form-item :label="t('auth.newPassword')" prop="newPassword">
                <el-input
                  v-model="passwordForm.newPassword"
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
                  v-model="passwordForm.passwordConfirm"
                  type="password"
                  autocomplete="new-password"
                  show-password
                />
              </el-form-item>
              <p v-if="passwordError" class="notice err" role="alert">
                {{ passwordError }}
              </p>
              <p v-if="passwordOk" class="notice ok">{{ passwordOk }}</p>
              <el-button
                type="primary"
                native-type="submit"
                :loading="passwordSaving"
              >
                {{ t('account.savePassword') }}
              </el-button>
            </el-form>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
