<script setup lang="ts">
import { getLocalized, vehicleLabel } from '~/data/products'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const {
  heroSlides,
  featuredProducts,
  hotProducts,
  newProducts,
  services,
  homeVehicles,
  pending,
} = useHomePageData()

useScrollReveal(() => [
  pending.value,
  featuredProducts.value.length,
  services.value.length,
  homeVehicles.value.length,
])

const featuredHero = computed(() => featuredProducts.value[0] || null)
const featuredRest = computed(() => featuredProducts.value.slice(1, 4))

const elevatorItems = computed(() => {
  const items: Array<{ id: string; label: string }> = []
  if (heroSlides.value.length) {
    items.push({ id: 'home-hero', label: t('home.elevator.hero') })
  }
  items.push(
    { id: 'home-featured', label: t('home.elevator.featured') },
    { id: 'home-hot', label: t('home.elevator.hot') },
    { id: 'home-new', label: t('home.elevator.new') },
  )
  if (services.value.length) {
    items.push({ id: 'home-services', label: t('home.elevator.services') })
  }
  if (homeVehicles.value.length) {
    items.push({ id: 'home-vehicles', label: t('home.elevator.vehicles') })
  }
  return items
})
</script>

<template>
  <div class="home-page">
    <SeoGeoItemList
      :items="
        featuredProducts.map((p) => ({
          name: getLocalized(p.name, locale),
          url: localePath(`/products/${p.slug}`),
        }))
      "
    />
    <ClientOnly>
      <HomeElevator :items="elevatorItems" />
    </ClientOnly>
    <HeroCarousel v-if="heroSlides.length" :slides="heroSlides" />

    <section id="home-featured" class="section home-anchor" data-reveal>
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title">{{ t('home.featuredTitle') }}</h2>
            <p class="section-desc">{{ t('home.featuredDesc') }}</p>
          </div>
          <NuxtLink class="btn btn-ghost" :to="localePath('/products')" prefetch>
            {{ t('common.viewAll') }}
          </NuxtLink>
        </div>

        <ProductGridSkeleton v-if="pending && !featuredProducts.length" :count="3" />
        <div v-else class="featured-layout" data-reveal-stagger>
          <ProductCard v-if="featuredHero" :product="featuredHero" />
          <div class="product-grid" style="grid-template-columns: 1fr">
            <ProductCard
              v-for="p in featuredRest"
              :key="p.id"
              :product="p"
              mode="list"
            />
          </div>
        </div>
      </div>
    </section>

    <section id="home-hot" class="section home-anchor" style="padding-top: 0" data-reveal>
      <div class="container">
        <h2 class="section-title">{{ t('home.hotTitle') }}</h2>
        <p class="section-desc">{{ t('home.hotDesc') }}</p>
        <ProductGridSkeleton v-if="pending && !hotProducts.length" />
        <div v-else class="product-grid" data-reveal-stagger>
          <ProductCard v-for="p in hotProducts" :key="p.id" :product="p" />
        </div>
      </div>
    </section>

    <section id="home-new" class="section home-anchor" style="padding-top: 0" data-reveal>
      <div class="container">
        <h2 class="section-title">{{ t('home.newTitle') }}</h2>
        <p class="section-desc">{{ t('home.newDesc') }}</p>
        <div class="product-rail" data-reveal-stagger>
          <ProductCard v-for="p in newProducts" :key="p.id" :product="p" />
        </div>
      </div>
    </section>

    <section
      v-if="services.length"
      id="home-services"
      class="section home-anchor"
      style="padding-top: 0"
      data-reveal
    >
      <div class="container">
        <h2 class="section-title">{{ t('home.serviceTitle') }}</h2>
        <p class="section-desc">{{ t('home.serviceDesc') }}</p>
        <div class="service-list" style="margin-top: 24px" data-reveal-stagger>
          <article
            v-for="(s, i) in services"
            :key="s.id"
            class="service-row"
          >
            <span class="service-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <h3>{{ s.title }}</h3>
            <p>{{ s.body }}</p>
          </article>
        </div>
      </div>
    </section>

    <section
      v-if="homeVehicles.length"
      id="home-vehicles"
      class="section home-anchor"
      style="padding-top: 0"
      data-reveal
    >
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title">{{ t('home.vehiclesTitle') }}</h2>
            <p class="section-desc">{{ t('home.vehiclesDesc') }}</p>
          </div>
          <NuxtLink class="btn btn-ghost" :to="localePath('/products')" prefetch>
            {{ t('common.viewAll') }}
          </NuxtLink>
        </div>
        <div class="vehicle-grid" data-reveal-stagger>
          <NuxtLink
            v-for="vehicle in homeVehicles"
            :key="vehicle.id"
            class="vehicle-card"
            :to="{ path: localePath('/products'), query: { vehicleId: String(vehicle.id) } }"
            prefetch
          >
            <div class="vehicle-card-media">
              <img
                :src="vehicle.imageUrl"
                :alt="vehicleLabel(vehicle, locale)"
                width="640"
                height="400"
              />
            </div>
            <h3>{{ vehicleLabel(vehicle, locale) }}</h3>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
