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

const featuredHero = computed(() => featuredProducts.value[0] || null)
const featuredRest = computed(() => featuredProducts.value.slice(1, 4))
</script>

<template>
  <div>
    <SeoGeoItemList
      :items="
        featuredProducts.map((p) => ({
          name: getLocalized(p.name, locale),
          url: localePath(`/products/${p.slug}`),
        }))
      "
    />
    <HeroCarousel v-if="heroSlides.length" :slides="heroSlides" />

    <section class="section">
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
        <div v-else class="featured-layout">
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

    <section class="section" style="padding-top: 0">
      <div class="container">
        <h2 class="section-title">{{ t('home.hotTitle') }}</h2>
        <p class="section-desc">{{ t('home.hotDesc') }}</p>
        <ProductGridSkeleton v-if="pending && !hotProducts.length" />
        <div v-else class="product-grid" style="margin-top: 24px">
          <ProductCard v-for="p in hotProducts" :key="p.id" :product="p" />
        </div>
      </div>
    </section>

    <section class="section" style="padding-top: 0">
      <div class="container">
        <h2 class="section-title">{{ t('home.newTitle') }}</h2>
        <p class="section-desc">{{ t('home.newDesc') }}</p>
        <div class="product-rail" style="margin-top: 24px">
          <ProductCard v-for="p in newProducts" :key="p.id" :product="p" />
        </div>
      </div>
    </section>

    <section v-if="services.length" class="section" style="padding-top: 0">
      <div class="container">
        <h2 class="section-title">{{ t('home.serviceTitle') }}</h2>
        <p class="section-desc">{{ t('home.serviceDesc') }}</p>
        <div class="service-list" style="margin-top: 24px">
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

    <section v-if="homeVehicles.length" class="section" style="padding-top: 0">
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
        <div class="vehicle-grid">
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
