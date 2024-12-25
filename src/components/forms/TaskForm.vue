<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import TextField from "./elements/TextField.vue";
import { useQuasar } from "quasar";
import { Task, WorkLog } from "../../types/project-types";
import EditorField from "./elements/EditorField.vue";
import { convertUnixTimestampToTimeInput } from "../../util/time-string-to-unix";
import WorkLogDialog from "../dialogs/WorkLogDialog.vue";
import TwoColumn from "../layout/TwoColumn.vue";
import moment from "moment";
import { unixTimestampToDateString } from "../../util/timestamp";

const props = defineProps<{
  formData: Task;
}>();
const emit = defineEmits<{
  (e: "submit", formData: Task): void;
  (e: "silentSubmit", formData: Task): void;
}>();

const formData = reactive<Task>(props.formData);
const $q = useQuasar();
const rules = {
  title: { required },
  description: { required },
};
const v$ = useVuelidate(rules, formData);
const tab = ref<string>("workLogs");
const emptyWorkLog: WorkLog = {
  creationDateTime: 0,
  displayDateTime: 0,
  message: "",
  trackedTime: 0,
  billable: true,
};
const workLogToEdit = ref<WorkLog | null>(null);
const newWorkLog = ref<WorkLog | null>(null);
const showNewWorkLogDialog = ref<boolean>(false);
const showEditWorkLogDialog = ref<boolean>(false);
const timeTotal = computed(() =>
  formData.workLogs.reduce((total, workLog) => total + workLog.trackedTime, 0)
);
const timeBillableTotal = computed(() =>
  formData.workLogs.reduce((total, workLog) => {
    return workLog.billable ? total + workLog.trackedTime : total;
  }, 0)
);
function onSubmit(): void {
  v$.value.$touch();
  if (!v$.value.$invalid) {
    emit("submit", JSON.parse(JSON.stringify(props.formData)));
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
function onNewWorkLog(): void {
  newWorkLog.value = JSON.parse(JSON.stringify(emptyWorkLog));
  showNewWorkLogDialog.value = true;
}

function onCreateWorklog() {
  const workLog = JSON.parse(JSON.stringify(newWorkLog.value));
  workLog.creationDateTime = moment().unix();
  workLog.displayDateTime = workLog.creationDateTime; // @todo Fix me

  formData.workLogs.push(workLog);
  newWorkLog.value = null;
  showNewWorkLogDialog.value = false;
  emit("silentSubmit", JSON.parse(JSON.stringify(props.formData)));
}

function onCloseCreateWorklog() {
  showNewWorkLogDialog.value = false;
  newWorkLog.value = null;
}

function onEditWorkLog(workLog: WorkLog): void {
  workLogToEdit.value = workLog;
  showEditWorkLogDialog.value = true;
}

function onUpdateWorkLog(workLog: WorkLog): void {
  showEditWorkLogDialog.value = false;
  workLogToEdit.value = null;
  emit("silentSubmit", JSON.parse(JSON.stringify(props.formData)));
}

function onCloseUpdateWorklog() {
  showEditWorkLogDialog.value = false;
  workLogToEdit.value = null;
}

function onDeleteWorkLog(workLog: WorkLog): void {
  // @todo show conform dialog.
  const index = formData.workLogs.indexOf(workLog);
  if (index > -1) {
    formData.workLogs.splice(index, 1);
  }
}
</script>

<template>
  <q-form @submit="onSubmit" class="q-gutter-md">
    <TextField
      label="Title*"
      hint="Title."
      :validation="v$"
      property="title"
      :value="formData.title"
      @change="(value: string) => (formData.title = value)"
    />

    <EditorField
      label="Description*"
      hint="Description."
      :validation="v$"
      property="description"
      :value="formData.description"
      @change="(value: string) => (formData.description = value)"
    />

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

  <q-card v-if="formData.creationDateTime" class="bg-dark q-mt-md">
    <q-tabs
      v-model="tab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="comments" label="Comments" :disable="true" />
      <q-tab name="workLogs" label="Work logs" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab" animated class="bg-dark">
      <q-tab-panel name="comments"> </q-tab-panel>

      <q-tab-panel name="workLogs">
        <q-list bordered padding dark class="q-mb-md">
          <q-item v-for="(workLog, i) in formData.workLogs" :key="i">
            <q-item-section avatar>
              <q-icon
                v-if="workLog.billable"
                size="sm"
                name="attach_money"
                title="Work log is billable."
              />
              <q-icon
                v-else
                size="sm"
                color="grey"
                name="money_off"
                title="Work log is not billable."
              />
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ convertUnixTimestampToTimeInput(workLog.trackedTime) }}
              </q-item-label>
              <q-item-label caption lines="2" class="text-white">
                {{ workLog.message }}
              </q-item-label>
              <q-item-label caption class="text-white">
                {{
                  unixTimestampToDateString(
                    workLog.creationDateTime,
                    "D.M.YYYY"
                  )
                }}
              </q-item-label>
            </q-item-section>

            <q-item-section side top>
              <div class="row">
                <q-btn
                  dark
                  flat
                  icon="edit"
                  v-on:click="onEditWorkLog(workLog)"
                />
                <q-btn
                  dark
                  flat
                  icon="delete"
                  v-on:click="onDeleteWorkLog(workLog)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <TwoColumn>
          <template v-slot:leftColumn>
            Tracked:
            <q-badge align="middle" color="dark">
              {{ convertUnixTimestampToTimeInput(timeTotal) }}
            </q-badge>
            <q-space />
            Billable:
            <q-badge align="middle">
              {{ convertUnixTimestampToTimeInput(timeBillableTotal) }}
            </q-badge>
          </template>
          <template v-slot:rightColumn>
            <q-btn
              dark
              flat
              icon="add"
              v-on:click="onNewWorkLog"
              label="Add new work log"
            />
          </template>
        </TwoColumn>
      </q-tab-panel>
    </q-tab-panels>

    <WorkLogDialog
      v-if="workLogToEdit"
      title="Edit work log"
      :confirm="showEditWorkLogDialog"
      :work-log="workLogToEdit"
      v-on:submit="onUpdateWorkLog"
      v-on:close="onCloseUpdateWorklog"
    />
    <WorkLogDialog
      v-if="newWorkLog"
      title="Create a new work log"
      :confirm="showNewWorkLogDialog"
      :work-log="newWorkLog"
      v-on:submit="onCreateWorklog"
      v-on:close="onCloseCreateWorklog"
    />
  </q-card>
</template>
