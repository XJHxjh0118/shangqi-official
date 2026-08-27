<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { MyInquiry } from '~/types/api'
import { regionLabel } from '~/data/regions'
import { resolveAssetUrl } from '~/utils/media'

definePageMeta({
  middleware: 'auth',
  ssr: false,
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { profile, fetchProfile, logout, authErrorMessage } = useAuth()
const { updateProfile, changePassword, getMyInquiries, apiBase } = useApi()
const { count } = useInquiryList()
const { items: favs } = useFavorites()
const { template } = useSiteTemplate()

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

const historyLoading = ref(false)
const historyError = ref('')
const historyList = ref<MyInquiry[]>([])
const historyTotal = ref(0)
const historyPage = ref(1)
const historyPageSize = 10
const historyKeyword = ref('')

const drawerVisible = ref(false)
const drawerView = ref<'list' | 'detail'>('list')
const activeInquiry = ref<MyInquiry | null>(null)
let historySearchTimer: ReturnType<typeof setTimeout> | null = null

const drawerTitle = computed(() =>
  drawerView.value === 'detail'
    ? t('account.historyDetail')
    : t('account.historyTitle'),
)

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

function inquiryStatusLabel(status: string) {
  return status === 'HANDLED' ? t('account.statusHandled') : t('account.statusNew')
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function itemName(item: MyInquiry['items'][number]) {
  const i18n = item.product?.i18n || []
  const preferred =
    i18n.find((row) => row.locale === locale.value) ||
    i18n.find((row) => row.locale?.startsWith('zh')) ||
    i18n[0]
  return preferred?.name || item.product?.sku || `#${item.product?.id || item.id}`
}

function itemCover(item: MyInquiry['items'][number]) {
  return resolveAssetUrl(item.product?.coverUrl, apiBase)
}

function productPath(slug?: string | null) {
  if (!slug) return localePath('/products')
  return template.value === 'portal'
    ? localePath(`/portal/products/${slug}`)
    : localePath(`/products/${slug}`)
}

function previewNames(row: MyInquiry) {
  const names = (row.items || []).slice(0, 2).map((item) => itemName(item))
  const extra = (row.items?.length || 0) - names.length
  if (!names.length) return '—'
  return extra > 0 ? `${names.join('、')}…` : names.join('、')
}

async function loadHistory(page = historyPage.value) {
  historyLoading.value = true
  historyError.value = ''
  try {
    const keyword = historyKeyword.value.trim()
    const data = await getMyInquiries({
      page,
      pageSize: historyPageSize,
      ...(keyword ? { keyword } : {}),
    })
    historyList.value = data.list || []
    historyTotal.value = data.total || 0
    historyPage.value = data.page || page
  } catch (err) {
    historyError.value = authErrorMessage(err) || t('account.historyLoadFailed')
    historyList.value = []
    historyTotal.value = 0
  } finally {
    historyLoading.value = false
  }
}

async function openHistoryDrawer() {
  drawerView.value = 'list'
  activeInquiry.value = null
  drawerVisible.value = true
  await loadHistory(historyKeyword.value.trim() ? 1 : historyPage.value || 1)
}

function openInquiryDetail(row: MyInquiry) {
  activeInquiry.value = row
  drawerView.value = 'detail'
}

function backToHistoryList() {
  drawerView.value = 'list'
  activeInquiry.value = null
}

function onHistorySearchInput(value: string) {
  historyKeyword.value = value
  if (historySearchTimer) clearTimeout(historySearchTimer)
  historySearchTimer = setTimeout(() => {
    void loadHistory(1)
  }, 280)
}

onMounted(async () => {
  try {
    await fetchProfile()
  } catch {
    // middleware handles expired sessions
  }
  fillProfile()
  try {
    const data = await getMyInquiries({ page: 1, pageSize: 1 })
    historyTotal.value = data.total || 0
  } catch {
    historyTotal.value = 0
  }
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
            <button
              class="account-link-btn"
              type="button"
              @click="openHistoryDrawer"
            >
              {{ t('account.historyTitle') }}
              <span v-if="historyTotal"> ({{ historyTotal }})</span>
            </button>
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

      <el-drawer
        v-model="drawerVisible"
        :title="drawerTitle"
        direction="rtl"
        size="440px"
        append-to-body
        class="account-history-drawer"
        @closed="backToHistoryList"
      >
        <div class="account-history-drawer-body">
          <template v-if="drawerView === 'list'">
            <div class="account-history-drawer-search">
              <el-input
                :model-value="historyKeyword"
                clearable
                :placeholder="t('account.historySearch')"
                @update:model-value="onHistorySearchInput"
              />
            </div>

            <div v-if="historyLoading" class="account-history-loading">
              {{ t('common.loading') }}
            </div>
            <p v-else-if="historyError" class="notice err" role="alert">
              {{ historyError }}
            </p>
            <div
              v-else-if="!historyList.length"
              class="account-history-empty"
            >
              <p>
                {{
                  historyKeyword.trim()
                    ? t('account.historySearchEmpty')
                    : t('account.historyEmpty')
                }}
              </p>
              <NuxtLink
                v-if="!historyKeyword.trim()"
                class="btn btn-primary"
                :to="localePath('/inquiry')"
                @click="drawerVisible = false"
              >
                {{ t('account.goInquiry') }}
              </NuxtLink>
            </div>
            <template v-else>
              <ul class="account-history-rows">
                <li v-for="row in historyList" :key="row.id">
                  <button
                    type="button"
                    class="account-history-row"
                    @click="openInquiryDetail(row)"
                  >
                    <div class="account-history-row-main">
                      <strong>
                        {{ t('account.historyId', { id: row.id }) }}
                      </strong>
                      <span class="account-history-meta">
                        {{ formatDateTime(row.createdAt) }}
                        ·
                        {{
                          t('account.historyItems', {
                            n: row.items?.length || 0,
                          })
                        }}
                      </span>
                      <span class="account-history-preview">
                        {{ previewNames(row) }}
                      </span>
                    </div>
                    <span
                      class="account-history-status"
                      :data-status="
                        row.status === 'HANDLED' ? 'handled' : 'new'
                      "
                    >
                      {{ inquiryStatusLabel(row.status) }}
                    </span>
                  </button>
                </li>
              </ul>

              <div
                v-if="historyTotal > historyPageSize"
                class="account-history-pager"
              >
                <el-pagination
                  background
                  layout="prev, pager, next"
                  :page-size="historyPageSize"
                  :current-page="historyPage"
                  :total="historyTotal"
                  @current-change="loadHistory"
                />
              </div>
            </template>
          </template>

          <template v-else-if="activeInquiry">
            <button
              type="button"
              class="account-history-back"
              @click="backToHistoryList"
            >
              ← {{ t('account.historyBack') }}
            </button>

            <header class="account-history-drawer-head">
              <div>
                <h3>
                  {{ t('account.historyId', { id: activeInquiry.id }) }}
                </h3>
                <p>
                  {{ formatDateTime(activeInquiry.createdAt) }}
                  ·
                  {{
                    t('account.historyItems', {
                      n: activeInquiry.items?.length || 0,
                    })
                  }}
                </p>
              </div>
              <span
                class="account-history-status"
                :data-status="
                  activeInquiry.status === 'HANDLED' ? 'handled' : 'new'
                "
              >
                {{ inquiryStatusLabel(activeInquiry.status) }}
              </span>
            </header>

            <div class="account-history-drawer-block">
              <h4>{{ t('account.historyProducts') }}</h4>
              <ul class="account-history-product-list">
                <li v-for="item in activeInquiry.items" :key="item.id">
                  <NuxtLink
                    class="account-history-product"
                    :to="productPath(item.product?.slug)"
                    @click="drawerVisible = false"
                  >
                    <img
                      v-if="itemCover(item)"
                      :src="itemCover(item)"
                      :alt="itemName(item)"
                      loading="lazy"
                    />
                    <span
                      v-else
                      class="account-history-product-fallback"
                      aria-hidden="true"
                    />
                    <span class="account-history-product-meta">
                      <strong>{{ itemName(item) }}</strong>
                      <em>{{ item.product?.sku || '' }}</em>
                    </span>
                    <span class="account-history-product-qty">
                      {{ t('account.historyQty', { n: item.quantity }) }}
                    </span>
                  </NuxtLink>
                </li>
              </ul>
            </div>

            <div
              v-if="activeInquiry.message"
              class="account-history-drawer-block"
            >
              <h4>{{ t('account.historyMessage') }}</h4>
              <p>{{ activeInquiry.message }}</p>
            </div>

            <div
              v-if="activeInquiry.status === 'HANDLED'"
              class="account-history-drawer-block"
            >
              <h4>{{ t('account.handleInfo') }}</h4>
              <dl class="account-history-handle-meta">
                <div>
                  <dt>{{ t('account.handledBy') }}</dt>
                  <dd>{{ activeInquiry.handledBy || '—' }}</dd>
                </div>
                <div>
                  <dt>{{ t('account.handledAt') }}</dt>
                  <dd>{{ formatDateTime(activeInquiry.handledAt) }}</dd>
                </div>
              </dl>
              <p v-if="activeInquiry.handleRemark">
                {{ activeInquiry.handleRemark }}
              </p>
            </div>
          </template>
        </div>
      </el-drawer>
    </div>
  </div>
</template>
