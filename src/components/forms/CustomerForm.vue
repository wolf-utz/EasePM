<script lang="ts" setup>
import { reactive, onMounted } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";
import { Customer } from "../../types/forms/customer-types";

const props = defineProps<{
  formData: Customer;
}>();
const emit = defineEmits<{
  (e: "submit", formData: Customer): void;
}>();

const formData = reactive<Customer>({
  _id: "",
  customerNumber: "",
  company: "",
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  city: "",
  zip: "",
  country: "",
} as Customer);

const rules = {
  _id: {},
  customerNumber: {},
  company: { required },
  firstName: { required },
  lastName: { required },
  email: { required, email },
  address: { required },
  city: { required },
  zip: { required },
  country: { required },
};

const v$ = useVuelidate(rules, formData);

function onSubmit(): void {
  emit("submit", formData);
}

onMounted(() => {
  Object.assign(formData, props.formData);
});
</script>

<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <div :class="{ error: v$.firstName.$errors.length }">
      <q-input
        filled
        v-model="formData.firstName"
        label="First name *"
        hint="First name"
        lazy-rules
        dark
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div
        class="input-errors"
        v-for="error of v$.firstName.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>
    <div :class="{ error: v$.lastName.$errors.length }">
      <q-input
        filled
        v-model="formData.lastName"
        label="Last name *"
        hint="Last Name"
        lazy-rules
        dark
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div
        class="input-errors"
        v-for="error of v$.lastName.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>
    <div :class="{ error: v$.company.$errors.length }">
      <q-input
        filled
        v-model="formData.company"
        label="Company (Optional)"
        hint="Company"
        lazy-rules
        dark
      />
      <div
        class="input-errors"
        v-for="error of v$.company.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>
    <div :class="{ error: v$.email.$errors.length }">
      <q-input
        filled
        v-model="formData.email"
        label="Email *"
        hint="Email"
        lazy-rules
        dark
        email
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div
        class="input-errors"
        v-for="error of v$.email.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>

    <div :class="{ error: v$.address.$errors.length }">
      <q-input
        filled
        v-model="formData.address"
        label="Address *"
        hint="Street and number"
        lazy-rules
        dark
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div
        class="input-errors"
        v-for="error of v$.address.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>

    <div class="row">
      <div class="col-6 q-px-sm">
        <div :class="{ error: v$.city.$errors.length }">
          <q-input
            filled
            v-model="formData.city"
            label="City *"
            hint="City Name"
            lazy-rules
            dark
            :rules="[
              (val) => (val && val.length > 0) || 'Please type something',
            ]"
          />
          <div
            class="input-errors"
            v-for="error of v$.city.$errors"
            :key="error.$uid"
          >
            <div class="error-msg">{{ error.$message }}</div>
          </div>
        </div>
      </div>
      <div class="col-6 q-px-sm">
        <div :class="{ error: v$.zip.$errors.length }">
          <q-input
            filled
            v-model="formData.zip"
            label="ZIP *"
            hint="City ZIP"
            lazy-rules
            dark
            :rules="[
              (val) => (val && val.length > 0) || 'Please type something',
            ]"
          />
          <div
            class="input-errors"
            v-for="error of v$.zip.$errors"
            :key="error.$uid"
          >
            <div class="error-msg">{{ error.$message }}</div>
          </div>
        </div>
      </div>
    </div>
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="save"
        type="submit"
        color="primary"
        title="Save record"
      />
    </q-page-sticky>
  </q-form>
</template>
