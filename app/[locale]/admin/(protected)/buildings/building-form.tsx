"use client";

import { useActionState } from "react";
import type { BuildingFormState, BuildingFormValues } from "@/lib/buildings/action-state";

type Labels = {
  nameLabel: string;
  addressLabel: string;
  historyFrLabel: string;
  historyEnLabel: string;
  styleTagsLabel: string;
  latLabel: string;
  lngLabel: string;
  coordsHint: string;
  submit: string;
};

type Action = (
  prevState: BuildingFormState,
  formData: FormData
) => Promise<BuildingFormState>;

type Props = {
  action: Action;
  initialValues: BuildingFormValues;
  labels: Labels;
};

const emptyState = (values: BuildingFormValues): BuildingFormState => ({
  fieldErrors: {},
  values,
});

export function BuildingForm({ action, initialValues, labels }: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    emptyState(initialValues)
  );

  const errorsFor = (field: string) => state.fieldErrors[field];

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Field id="name" label={labels.nameLabel} errors={errorsFor("name")}>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={state.values.name}
          className="border rounded px-3 py-2"
        />
      </Field>

      <Field id="address" label={labels.addressLabel} errors={errorsFor("address")}>
        <input
          id="address"
          name="address"
          type="text"
          required
          defaultValue={state.values.address}
          className="border rounded px-3 py-2"
        />
      </Field>

      <Field id="historyFr" label={labels.historyFrLabel} errors={errorsFor("historyFr")}>
        <textarea
          id="historyFr"
          name="historyFr"
          required
          rows={6}
          defaultValue={state.values.historyFr}
          className="border rounded px-3 py-2"
        />
      </Field>

      <Field id="historyEn" label={labels.historyEnLabel} errors={errorsFor("historyEn")}>
        <textarea
          id="historyEn"
          name="historyEn"
          required
          rows={6}
          defaultValue={state.values.historyEn}
          className="border rounded px-3 py-2"
        />
      </Field>

      <Field id="styleTags" label={labels.styleTagsLabel} errors={errorsFor("styleTags")}>
        <input
          id="styleTags"
          name="styleTags"
          type="text"
          defaultValue={state.values.styleTags}
          className="border rounded px-3 py-2"
        />
      </Field>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">{labels.coordsHint}</p>

      <div className="flex gap-4">
        <Field id="lat" label={labels.latLabel} errors={errorsFor("lat")}>
          <input
            id="lat"
            name="lat"
            type="text"
            inputMode="decimal"
            defaultValue={state.values.lat}
            className="border rounded px-3 py-2"
          />
        </Field>
        <Field id="lng" label={labels.lngLabel} errors={errorsFor("lng")}>
          <input
            id="lng"
            name="lng"
            type="text"
            inputMode="decimal"
            defaultValue={state.values.lng}
            className="border rounded px-3 py-2"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start border rounded px-4 py-2 font-medium"
      >
        {labels.submit}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  errors,
  children,
}: {
  id: string;
  label: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id}>{label}</label>
      {children}
      {errors?.map((error) => (
        <p key={error} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ))}
    </div>
  );
}
