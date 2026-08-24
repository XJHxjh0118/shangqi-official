<script setup lang="ts">
import { useRouter } from "vue-router";

defineOptions({ name: "ForgotPassword" });

const router = useRouter();
</script>

<template>
  <div class="forgot-page">
    <el-card class="forgot-card" shadow="never">
      <h2 class="mb-3">忘记密码</h2>
      <p class="mb-6 text-sm text-gray-500">
        请联系系统管理员重置密码。管理员可在「用户管理 - 后台账号」中为运营重置登录密码。
      </p>
      <el-button type="primary" @click="router.push('/login')">返回登录</el-button>
    </el-card>
  </div>
</template>

<style scoped>
.forgot-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color-page);
}
.forgot-card {
  width: 420px;
  padding: 12px 8px;
}
</style>
