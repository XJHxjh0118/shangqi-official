<script setup lang="ts">
import { getLocalized, vehicleLabel } from '~/data/products'

definePageMeta({
  layout: 'portal',
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const {
  heroSlides,
  featuredProducts,
  hotProducts,
  newProducts,
  homeVehicles,
  pending,
} = useHomePageData()
const { getContacts } = useApi()
const contactsAsync = useCachedAsyncData('portal-home-contacts', () => getContacts())

const pageRoot = ref<HTMLElement | null>(null)
const { refresh: refreshReveal } = usePortalReveal(pageRoot)

const slideIndex = ref(0)
const recoMode = ref<'hot' | 'new'>('hot')

const activeSlide = computed(
  () => heroSlides.value[slideIndex.value] || heroSlides.value[0] || null,
)

const recoProducts = computed(() =>
  recoMode.value === 'hot' ? hotProducts.value : newProducts.value,
)

const contacts = computed(() =>
  (contactsAsync.data.value || []).slice(0, 4).map((c) => ({
    id: c.id,
    region: locale.value === 'en' ? c.regionEn : c.regionZh,
    name: c.name,
    email: c.email || '',
    phone: c.phone || '',
  })),
)

const metrics = computed(() => [
  {
    value: String(Math.max(featuredProducts.value.length + hotProducts.value.length + newProducts.value.length, featuredProducts.value.length)),
    label: t('template.metricSku'),
  },
  {
    value: String(homeVehicles.value.length || '—'),
    label: t('template.metricVehicles'),
  },
  {
    value: String(contacts.value.length || '—'),
    label: t('template.metricPacks'),
  },
])

watch(heroSlides, (slides) => {
  if (slideIndex.value >= slides.length) slideIndex.value = 0
})

watch(
  () => [
    featuredProducts.value.length,
    recoProducts.value.length,
    homeVehicles.value.length,
    contacts.value.length,
    recoMode.value,
  ],
  async () => {
    await nextTick()
    refreshReveal()
  },
)

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    if (heroSlides.value.length < 2) return
    slideIndex.value = (slideIndex.value + 1) % heroSlides.value.length
  }, 6000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div ref="pageRoot">
    <section class="p-hero" aria-label="hero">
      <div class="p-hero-media">
        <img
          v-if="activeSlide?.image"
          :src="activeSlide.image"
          :alt="activeSlide.title"
        />
      </div>
      <div class="p-hero-copy">
        <div class="p-eyebrow">{{ t('template.heroEyebrow') }}</div>
        <h1>{{ activeSlide?.title || t('home.heroTitle') }}</h1>
        <p>{{ t('home.heroDesc') }}</p>
        <div class="p-hero-actions">
          <NuxtLink class="p-btn" :to="localePath('/portal/products')">
            {{ t('template.heroCta') }}
          </NuxtLink>
          <NuxtLink class="p-btn-ghost" :to="localePath('/portal/contact')">
            {{ t('nav.contact') }}
          </NuxtLink>
        </div>
        <div class="p-hero-metrics" aria-label="metrics">
          <div v-for="item in metrics" :key="item.label">
            <strong>{{ pending && item.value === '0' ? '—' : item.value }}</strong>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
      <div v-if="heroSlides.length > 1" class="p-hero-rail">
        <button
          v-for="(slide, i) in heroSlides"
          :key="slide.image + i"
          class="p-slide-dot"
          type="button"
          :class="{ active: i === slideIndex }"
          @click="slideIndex = i"
        >
          {{ String(i + 1).padStart(2, '0') }}
        </button>
      </div>
    </section>

    <section class="p-section">
      <div class="p-section-head p-reveal">
        <div class="p-eyebrow">{{ t('template.featuredEyebrow') }}</div>
        <h2>{{ t('home.featuredTitle') }}</h2>
        <p>{{ t('home.featuredDesc') }}</p>
      </div>
      <div v-if="pending && !featuredProducts.length" class="p-empty">
        {{ t('common.loading') }}
      </div>
      <div v-else class="p-grid-4">
        <NuxtLink
          v-for="product in featuredProducts.slice(0, 4)"
          :key="product.id"
          class="p-feature-card p-reveal"
          :to="localePath(`/portal/products/${product.slug}`)"
        >
          <div class="p-feature-media">
            <img
              v-if="product.previewImages[0] || product.images[0]"
              :src="product.previewImages[0] || product.images[0]"
              :alt="getLocalized(product.name, locale)"
              loading="lazy"
            />
          </div>
          <div class="p-feature-body">
            <h3>{{ getLocalized(product.name, locale) }}</h3>
            <div class="p-tags">
              <span
                v-for="v in product.vehicles.slice(0, 2)"
                :key="v.id"
              >
                {{ vehicleLabel(v, locale) }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>

    <section class="p-section" style="padding-top: 0">
      <div class="p-section-head p-reveal">
        <div class="p-eyebrow">{{ t('template.recoEyebrow') }}</div>
        <h2>{{ t('template.recoTitle') }}</h2>
      </div>
      <div class="p-segmented p-reveal" role="tablist">
        <button
          type="button"
          :class="{ active: recoMode === 'hot' }"
          @click="recoMode = 'hot'"
        >
          {{ t('template.recoHot') }}
        </button>
        <button
          type="button"
          :class="{ active: recoMode === 'new' }"
          @click="recoMode = 'new'"
        >
          {{ t('template.recoNew') }}
        </button>
      </div>
      <div class="p-grid-4">
        <PortalProductCard
          v-for="product in recoProducts.slice(0, 4)"
          :key="`${recoMode}-${product.id}`"
          :product="product"
        />
      </div>
    </section>

    <section v-if="homeVehicles.length" class="p-section" style="padding-top: 0">
      <div class="p-section-head p-reveal">
        <div class="p-eyebrow">{{ t('template.vehicleEyebrow') }}</div>
        <h2>{{ t('template.vehicleTitle') }}</h2>
      </div>
      <div class="p-vehicle-grid">
        <PortalVehicleCard
          v-for="item in homeVehicles"
          :key="item.id"
          :title="vehicleLabel(item, locale)"
          :subtitle="t('template.vehicleCta')"
          :to="localePath({ path: '/portal/products', query: { vehicleId: String(item.id) } })"
        />
      </div>
    </section>

    <section class="p-section" style="padding-top: 0">
      <div class="p-section-head p-reveal">
        <div class="p-eyebrow">{{ t('template.contactEyebrow') }}</div>
        <h2>{{ t('template.contactTitle') }}</h2>
        <p>{{ t('template.contactDesc') }}</p>
      </div>
      <div class="p-contact-grid">
        <article v-for="c in contacts" :key="c.id" class="p-contact-card p-reveal">
          <span>{{ c.region }}</span>
          <strong>{{ c.name }}</strong>
          <p v-if="c.email">{{ c.email }}</p>
          <p v-if="c.phone">{{ c.phone }}</p>
        </article>
      </div>
      <div class="p-reveal" style="margin-top: 22px">
        <NuxtLink class="p-btn" :to="localePath('/portal/contact')">
          {{ t('nav.contact') }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
