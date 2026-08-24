<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const localePath = useLocalePath()
const { profile, fetchProfile, logout } = useAuth()
const { count } = useInquiryList()
const { items: favs } = useFavorites()

onMounted(() => {
  fetchProfile().catch(() => {})
})

useSeoGeo({
  title: t('account.title'),
  description: t('account.desc'),
})

function onLogout() {
  logout()
  navigateTo(localePath('/login'))
}
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-head">
        <h1>{{ t('account.title') }}</h1>
        <p>{{ t('account.desc') }}</p>
      </header>

      <div class="account-grid" style="max-width: 640px">
        <div class="account-row">
          <span>{{ t('auth.email') }}</span>
          <strong>{{ profile?.email || profile?.username }}</strong>
        </div>
        <div class="account-row">
          <span>{{ t('auth.company') }}</span>
          <strong>{{ profile?.company || '—' }}</strong>
        </div>
        <div class="account-row">
          <span>{{ t('auth.contact') }}</span>
          <strong>{{ profile?.contactName || profile?.nickname || '—' }}</strong>
        </div>
        <div class="account-row">
          <span>{{ t('auth.phone') }}</span>
          <strong>{{ profile?.phone || '—' }}</strong>
        </div>
        <div class="account-row">
          <span>{{ t('auth.region') }}</span>
          <strong>{{ profile?.region || '—' }}</strong>
        </div>
        <div class="account-row">
          <span>{{ t('auth.address') }}</span>
          <strong>{{ profile?.address || '—' }}</strong>
        </div>
      </div>

      <p style="margin-top: 32px">
        {{ t('account.inquiryCount', { n: count }) }}
        ·
        <NuxtLink :to="localePath('/inquiry')">{{ t('nav.inquiry') }}</NuxtLink>
      </p>
      <p>
        <NuxtLink :to="localePath('/favorites')">
          {{ t('nav.favorites') }} ({{ favs.length }})
        </NuxtLink>
      </p>
      <p style="margin-top: 24px">
        <button class="btn btn-ghost" type="button" @click="onLogout">
          {{ t('auth.logout') }}
        </button>
      </p>
    </div>
  </div>
</template>
