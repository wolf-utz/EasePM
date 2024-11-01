<script lang="ts" setup>
import { reactive, onMounted } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";
import { PersonalFormData } from "../../types/forms/personal-data-form-types";

const props = defineProps<{ formData: PersonalFormData }>();
const emit = defineEmits<{
  (e: "submit", formData: PersonalFormData): void;
}>();

const formData = reactive<PersonalFormData>({
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  zip: "",
  country: "",
  email: "",
  banking: {
    iban: "",
    bic: "",
    bank: "",
  },
  taxId: "",
  taxNumber: "",
} as PersonalFormData);

const rules = {
  firstName: { required },
  lastName: { required },
  address: { required },
  city: { required },
  zip: { required },
  country: { required },
  email: { required, email },
  banking: {
    iban: { required },
    bic: { required },
    bank: { required },
  },
  taxId: {},
  taxNumber: { required },
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
    <h2 class="text-h5">Personal data</h2>
    <div :class="{ error: v$.firstName.$errors.length }">
      <q-input
        filled
        v-model="formData.firstName"
        label="Your first name *"
        hint="First Name"
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
        label="Your last name *"
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

    <div :class="{ error: v$.address.$errors.length }">
      <q-input
        filled
        v-model="formData.address"
        label="Your address *"
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
            label="Your city name *"
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
            label="Your city ZIP *"
            hint="ZIP"
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

    <div :class="{ error: v$.email.$errors.length }">
      <q-input
        filled
        v-model="formData.email"
        label="Your email *"
        hint="Email"
        lazy-rules
        dark
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

    <h2 class="text-h5">Banking</h2>
    <div :class="{ error: v$.banking.bank.$errors.length }">
      <q-input
        filled
        v-model="formData.banking.bank"
        label="Your bank name *"
        hint="Bank name"
        lazy-rules
        dark
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div
        class="input-errors"
        v-for="error of v$.banking.bank.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>
    <div :class="{ error: v$.banking.iban.$errors.length }">
      <q-input
        filled
        v-model="formData.banking.iban"
        label="Your bank IBAN *"
        hint="IBAN"
        lazy-rules
        dark
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div
        class="input-errors"
        v-for="error of v$.banking.iban.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>
    <div :class="{ error: v$.banking.bic.$errors.length }">
      <q-input
        filled
        v-model="formData.banking.bic"
        label="Your bank BIC *"
        hint="BIC"
        lazy-rules
        dark
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div
        class="input-errors"
        v-for="error of v$.banking.bic.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>

    <h2 class="text-h5">Tax</h2>
    <div :class="{ error: v$.taxId.$errors.length }">
      <q-input
        filled
        v-model="formData.taxId"
        label="Your TAX ID"
        hint="TAX ID"
        lazy-rules
        dark
      />
      <div
        class="input-errors"
        v-for="error of v$.taxId.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>
    <div :class="{ error: v$.taxNumber.$errors.length }">
      <q-input
        filled
        v-model="formData.taxNumber"
        label="Your TAX number"
        hint="TAX number"
        lazy-rules
        dark
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div
        class="input-errors"
        v-for="error of v$.taxNumber.$errors"
        :key="error.$uid"
      >
        <div class="error-msg">{{ error.$message }}</div>
      </div>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn icon="save" type="submit" color="primary" />
    </q-page-sticky>
  </q-form>
</template>
