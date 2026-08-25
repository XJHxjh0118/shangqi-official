<script setup lang="ts">
import { PhMinus, PhPlus, PhTrash } from '@phosphor-icons/vue'

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
  <div class="page">
    <div class="container">
      <header class="page-head cart-head">
        <div>
          <h1>{{ t('inquiry.title') }}</h1>
          <p>{{ t('inquiry.desc') }}</p>
        </div>
        <NuxtLink class="btn btn-ghost" :to="localePath('/products')" prefetch>
          {{ t('inquiry.continue') }}
        </NuxtLink>
      </header>

      <div v-if="submitted" class="cart-success">
        <p>{{ t('inquiry.success') }}</p>
        <NuxtLink class="btn btn-primary" :to="localePath('/products')" prefetch>
          {{ t('inquiry.browse') }}
        </NuxtLink>
      </div>

      <div v-else-if="!items.length" class="empty-state">
        <p>{{ t('inquiry.empty') }}</p>
        <p style="margin-top: 16px">
          <NuxtLink class="btn btn-primary" :to="localePath('/products')" prefetch>
            {{ t('inquiry.browse') }}
          </NuxtLink>
        </p>
      </div>

      <div v-else class="cart-layout">
        <section class="cart-list" :aria-label="t('inquiry.title')">
          <p class="cart-list-count">{{ t('inquiry.count', { n: count }) }}</p>
          <ul>
            <li v-for="item in items" :key="item.id" class="cart-row">
              <div class="cart-row-media">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  width="200"
                  height="150"
                />
              </div>
              <div class="cart-row-copy">
                <NuxtLink
                  v-if="item.slug"
                  class="cart-row-name"
                  :to="localePath(`/products/${item.slug}`)"
                >
                  {{ item.name }}
                </NuxtLink>
                <p v-else class="cart-row-name">{{ item.name }}</p>
                <p class="product-meta">{{ item.sku }}</p>
                <div class="cart-row-tools">
                  <div class="qty-stepper" role="group" :aria-label="t('inquiry.qty')">
                    <button
                      type="button"
                      :aria-label="t('inquiry.qtyDown')"
                      :disabled="item.qty <= 1"
                      @click="updateQty(item.id, item.qty - 1)"
                    >
                      <PhMinus :size="14" weight="regular" />
                    </button>
                    <input
                      class="qty-input"
                      :value="item.qty"
                      type="number"
                      min="1"
                      max="999"
                      :aria-label="t('inquiry.qty')"
                      @change="
                        updateQty(
                          item.id,
                          Number(($event.target as HTMLInputElement).value) || 1,
                        )
                      "
                    />
                    <button
                      type="button"
                      :aria-label="t('inquiry.qtyUp')"
                      @click="updateQty(item.id, item.qty + 1)"
                    >
                      <PhPlus :size="14" weight="regular" />
                    </button>
                  </div>
                  <button
                    class="cart-remove"
                    type="button"
                    :aria-label="t('common.remove')"
                    @click="removeItem(item.id)"
                  >
                    <PhTrash :size="16" weight="regular" />
                    <span>{{ t('common.remove') }}</span>
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </section>

        <aside class="cart-aside">
          <h2>{{ t('inquiry.dealerTitle') }}</h2>
          <el-form
            ref="formRef"
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
            <el-form-item :label="t('inquiry.phone')" prop="phone">
              <el-input v-model="form.phone" />
            </el-form-item>
            <el-form-item :label="t('inquiry.region')" prop="region">
              <el-select v-model="form.region" style="width: 100%">
                <el-option
                  v-for="r in regions"
                  :key="r"
                  :label="t('inquiry.regions.' + r)"
                  :value="r"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('inquiry.message')" prop="message">
              <el-input v-model="form.message" type="textarea" :rows="4" />
            </el-form-item>
            <p v-if="submitError" class="notice err">{{ submitError }}</p>
            <el-form-item>
              <el-button
                type="primary"
                native-type="submit"
                :loading="submitting"
              >
                {{ t('inquiry.submit') }}
              </el-button>
            </el-form-item>
          </el-form>
        </aside>
      </div>
    </div>
  </div>
</template>
