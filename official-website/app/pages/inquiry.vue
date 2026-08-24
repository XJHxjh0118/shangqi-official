<script setup lang="ts">
const {
  t,
  localePath,
  items,
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
      <header class="page-head">
        <h1>{{ t('inquiry.title') }}</h1>
        <p>{{ t('inquiry.desc') }}</p>
      </header>

      <p v-if="submitted" class="notice ok">{{ t('inquiry.success') }}</p>
      <div v-else-if="!items.length" class="empty-state">
        <p>{{ t('inquiry.empty') }}</p>
        <p style="margin-top: 16px">
          <NuxtLink class="btn btn-primary" :to="localePath('/products')" prefetch>
            {{ t('inquiry.browse') }}
          </NuxtLink>
        </p>
      </div>

      <div v-else>
        <ul>
          <li v-for="item in items" :key="item.id" class="inquiry-item">
            <img :src="item.image" :alt="item.name" width="72" height="54" />
            <div>
              <strong>{{ item.name }}</strong>
              <p class="product-meta">{{ item.sku }}</p>
            </div>
            <input
              class="qty-input"
              :value="item.qty"
              type="number"
              min="1"
              max="999"
              @change="updateQty(item.id, Number(($event.target as HTMLInputElement).value) || 1)"
            />
            <button class="btn btn-ghost" type="button" style="min-width: auto" @click="removeItem(item.id)">
              {{ t('common.remove') }}
            </button>
          </li>
        </ul>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          style="margin-top: 32px; max-width: 560px"
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
            <el-button type="primary" native-type="submit" :loading="submitting">
              {{ t('inquiry.submit') }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>
