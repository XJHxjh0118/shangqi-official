<script setup lang="ts">
definePageMeta({
  layout: 'portal',
  middleware: 'auth',
})

const {
  t,
  localePath,
  items,
  count,
  updateQty,
  removeItem,
  formRef,
  form,
  submitted,
  submitting,
  submitError,
  regions,
  rules,
  onSubmit,
} = useInquiryPage()
</script>

<template>
  <div class="p-section">
    <div class="p-section-head" style="display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap">
      <div>
        <div class="p-eyebrow">Inquiry Basket</div>
        <h1>{{ t('inquiry.title') }}</h1>
        <p>{{ t('inquiry.desc') }}</p>
      </div>
      <NuxtLink class="p-btn-ghost" :to="localePath('/portal/products')">
        {{ t('inquiry.continue') }}
      </NuxtLink>
    </div>

    <div v-if="submitted" class="p-empty">
      <p>{{ t('inquiry.success') }}</p>
      <p style="margin-top: 16px">
        <NuxtLink class="p-btn" :to="localePath('/portal/products')">
          {{ t('inquiry.browse') }}
        </NuxtLink>
      </p>
    </div>

    <div v-else-if="!items.length" class="p-empty">
      <p>{{ t('inquiry.empty') }}</p>
      <p style="margin-top: 16px">
        <NuxtLink class="p-btn" :to="localePath('/portal/products')">
          {{ t('inquiry.browse') }}
        </NuxtLink>
      </p>
    </div>

    <div v-else class="p-grid-3" style="align-items: start">
      <section class="p-list" style="grid-column: span 2">
        <p class="p-meta" style="margin-bottom: 12px">{{ t('inquiry.count', { n: count }) }}</p>
        <article v-for="item in items" :key="item.id" class="p-list-item">
          <img v-if="item.image" :src="item.image" :alt="item.name" />
          <div v-else />
          <div>
            <NuxtLink
              v-if="item.slug"
              :to="localePath(`/portal/products/${item.slug}`)"
            >
              <strong>{{ item.name }}</strong>
            </NuxtLink>
            <strong v-else>{{ item.name }}</strong>
            <p class="p-meta">{{ item.sku }}</p>
            <div style="display: flex; gap: 8px; margin-top: 8px; align-items: center">
              <button class="p-btn-ghost" type="button" @click="updateQty(item.id, item.qty - 1)">
                -
              </button>
              <span>{{ item.qty }}</span>
              <button class="p-btn-ghost" type="button" @click="updateQty(item.id, item.qty + 1)">
                +
              </button>
            </div>
          </div>
          <button class="p-btn-ghost" type="button" @click="removeItem(item.id)">
            {{ t('common.remove') }}
          </button>
        </article>
      </section>

      <el-form
        ref="formRef"
        class="p-form p-card"
        style="padding: 18px"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item :label="t('inquiry.company')" prop="company">
          <el-input v-model="form.company" />
        </el-form-item>
        <el-form-item :label="t('inquiry.contact')" prop="contact">
          <el-input v-model="form.contact" />
        </el-form-item>
        <el-form-item :label="t('inquiry.email')" prop="email">
          <el-input v-model="form.email" type="email" />
        </el-form-item>
        <el-form-item :label="t('inquiry.phone')">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item :label="t('inquiry.region')">
          <el-select v-model="form.region" style="width: 100%">
            <el-option
              v-for="r in regions"
              :key="r"
              :label="t(`inquiry.regions.${r}`)"
              :value="r"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('inquiry.message')">
          <el-input v-model="form.message" type="textarea" :rows="4" />
        </el-form-item>
        <p v-if="submitError" style="color: #ff6b6b">{{ submitError }}</p>
        <button class="p-btn" type="submit" :disabled="submitting">
          {{ submitting ? t('common.loading') : t('inquiry.submit') }}
        </button>
      </el-form>
    </div>
  </div>
</template>
