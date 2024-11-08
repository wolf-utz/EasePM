<script lang="ts" setup>
import { useVuelidate } from "@vuelidate/core";
import { useQuasar } from "quasar";
import CustomerSingleSelectField from "./elements/CustomerSingleSelectField.vue";
import DateField from "./elements/DateField.vue";
import { numeric, required } from "@vuelidate/validators";
import {
  dateStringToUnixTimestamp,
  unixTimestampToDateString,
} from "../../util/timestamp";
import TwoColumn from "../layout/TwoColumn.vue";
import LineItemsField from "./elements/LineItemsField.vue";
import { Invoice, LineItem } from "../../types/invoice-types";
import { ref } from "vue";
import { formatCurrency } from "../../util/format-currency";
import CheckboxField from "./elements/CheckboxField.vue";

const props = defineProps<{
  formData: Invoice;
}>();
const emit = defineEmits<{
  (e: "submit", formData: Invoice): void;
}>();
const $q = useQuasar();

const rules = {
  total: { required },
  _customerId: { required },
  invoiceNumber: { required },
  invoiceDate: { required, numeric },
  deliveryDate: { required, numeric },
  draft: { required },
  canceled: { required },
  billed: { required },
  lineItems: { required },
};
const invoice = ref<Invoice>(JSON.parse(JSON.stringify(props.formData)));
const v$ = useVuelidate(rules, invoice);

function computeInvoiceTotal() {
  const subTotals = invoice.value.lineItems.map(
    (lineItem) => lineItem.unitPrice * lineItem.quantity
  );
  invoice.value.total = subTotals.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
}
function onSubmit(): void {
  v$.value.$touch();
  if (!v$.value.$invalid) {
    emit("submit", JSON.parse(JSON.stringify(invoice.value)));
    return;
  }
  $q.notify({
    progress: true,
    type: "negative",
    timeout: 1500,
    position: "top",
    message: "The submited data is not valid. Please check the form.",
  });
}
</script>

<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <CustomerSingleSelectField
      :validation="v$"
      label="Customer"
      hint="Select customer"
      property="_customerId"
      :value="invoice._customerId"
      @change="(value) => (invoice._customerId = value)"
    />

    <TwoColumn>
      <template v-slot:leftColumn>
        <DateField
          :validation="v$"
          label="Invoice date"
          property="invoiceDate"
          :value="unixTimestampToDateString(invoice.invoiceDate, 'YYYY/MM/DD')"
          @change="(value: string) => invoice.invoiceDate = dateStringToUnixTimestamp(value, 'YYYY/MM/DD')"
        />
      </template>
      <template v-slot:rightColumn>
        <DateField
          :validation="v$"
          label="Delivery date"
          property="deliveryDate"
          :value="unixTimestampToDateString(invoice.deliveryDate, 'YYYY/MM/DD')"
          @change="(value: string) => invoice.deliveryDate = dateStringToUnixTimestamp(value, 'YYYY/MM/DD')"
        />
      </template>
    </TwoColumn>

    <LineItemsField
      :lineItems="invoice.lineItems"
      v-on:update="(lineItems: LineItem[]) => {
        invoice.lineItems = lineItems;
        computeInvoiceTotal()
      }"
    />
    <q-badge
      square
      class="text-h6"
      color="dark q-mb-xl"
      :label="'Invoice total: ' + formatCurrency(invoice.total)"
    />

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="save"
        type="submit"
        color="primary"
        title="Create new record"
      />
    </q-page-sticky>
  </q-form>
</template>
