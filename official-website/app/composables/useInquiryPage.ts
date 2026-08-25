import type { FormInstance, FormRules } from 'element-plus'
import { cleanInput, normalizeSubmitError } from '~/utils/form'

/** 意向咨询页逻辑 */
export function useInquiryPage() {
  const { t } = useI18n()
  const localePath = useLocalePath()
  const { items, updateQty, removeItem, clear, count } = useInquiryList()
  const { createInquiry } = useApi()
  const { profile } = useAuth()

  useSeoGeo({
    title: t('inquiry.seo.title'),
    description: t('inquiry.seo.desc'),
  })

  const formRef = ref<FormInstance>()
  const form = reactive({
    company: '',
    contact: '',
    email: '',
    phone: '',
    region: 'asia',
    message: '',
  })

  const submitted = ref(false)
  const submitting = ref(false)
  const submitError = ref('')
  const step = ref(1)

  watch(
    profile,
    (p) => {
      if (!p) return
      if (!form.company && p.company) form.company = p.company
      if (!form.contact && (p.contactName || p.nickname)) {
        form.contact = p.contactName || p.nickname
      }
      if (!form.email && (p.email || p.username)) {
        form.email = p.email || p.username
      }
      if (!form.phone && p.phone) form.phone = p.phone
      if (!form.region && p.region) form.region = p.region
    },
    { immediate: true },
  )

  const regions = [
    'asia',
    'europe',
    'anz',
    'sea',
    'americas',
    'me_africa',
    'latam',
    'russia',
  ]

  const rules = computed<FormRules>(() => ({
    company: [{ required: true, message: t('inquiry.company'), trigger: 'blur' }],
    contact: [{ required: true, message: t('inquiry.contact'), trigger: 'blur' }],
    email: [
      { required: true, message: t('inquiry.email'), trigger: 'blur' },
      { type: 'email', message: t('inquiry.email'), trigger: ['blur', 'change'] },
    ],
  }))

  function buildPayload() {
    return {
      company: cleanInput(form.company),
      contactName: cleanInput(form.contact),
      email: cleanInput(form.email),
      phone: form.phone ? cleanInput(form.phone) : undefined,
      region: form.region,
      message: form.message ? cleanInput(form.message) : undefined,
      items: items.value.map((item) => ({
        productId: Number(item.id),
        quantity: item.qty,
      })),
    }
  }

  function resetForm() {
    form.company = ''
    form.contact = ''
    form.email = ''
    form.phone = ''
    form.region = 'asia'
    form.message = ''
    formRef.value?.resetFields()
  }

  async function onSubmit() {
    if (!items.value.length || submitting.value) return
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    submitError.value = ''
    try {
      await createInquiry(buildPayload())
      submitted.value = true
      clear()
      resetForm()
    } catch (err: unknown) {
      submitError.value = normalizeSubmitError(err)
    } finally {
      submitting.value = false
    }
  }

  return {
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
    step,
    regions,
    rules,
    onSubmit,
  }
}

export const INQUIRY_PAGE_KEY = 'inquiry-page'

export function provideInquiryPage(page: ReturnType<typeof useInquiryPage>) {
  provide(INQUIRY_PAGE_KEY, page)
}

export function useInjectedInquiryPage() {
  const page = inject<ReturnType<typeof useInquiryPage>>(INQUIRY_PAGE_KEY)
  if (!page) {
    throw new Error('Inquiry page missing — call useInquiryPage in the page shell')
  }
  return page
}
