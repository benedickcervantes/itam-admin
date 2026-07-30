"use client";

import { useMemo } from "react";
import { ClipboardCheck, Monitor, Mouse, User } from "lucide-react";
import { Field, inputClass } from "@/components/Drawer";
import { FormSection, RecordedPreview, Subsection } from "@/components/FormSection";
import { optionsFromStrings, Select } from "@/components/Select";
import {
  BATTERY_STATUSES,
  CHARGER_STATUSES,
  DESKTOP_POWER_CONNECTIONS,
  OPERATING_SYSTEM_OPTIONS,
  RAM_SIZES,
  RAM_SPEEDS,
  RAM_TYPES,
  STORAGE_SIZES,
  STORAGE_TYPES,
  composeDesktopPower,
  composeLaptopKeyboard,
  composeLaptopPointer,
  composeLaptopPower,
  composeMonitorRecord,
  composePeripheralPair,
  composeRam,
  composeRamSlots,
  composeStorage,
  formatCondition,
  hasBuiltInScreen,
  isDesktopDevice,
  isInputIssueCondition,
  isLaptopDevice,
  hasOsEdition,
  getOsEditionLabel,
  getOsEditionOptions,
  getOsEditionPlaceholder,
  mouseConditions,
  peripheralConditions,
  screenConditions,
  showsInfraOs,
  showsInfraNetworkSpecs,
  showsInfraServerSpecs,
  showsInfraStorageSpecs,
  showsInfraMonitorSpecs,
  showsPortCount,
  showsRackSlot,
  type AssetCategory,
} from "@/lib/device-form";
import { labelEnum, upgradeChecklistLabel } from "@/lib/labels";
import { REFERENCE_DATA } from "@/lib/reference-data";
import type { Department } from "@/lib/types";

export type DeviceInventoryFormProps = {
  mode: "audit" | "asset";
  form: Record<string, string | boolean>;
  set: (key: string, value: string | boolean) => void;
  onDeviceTypeChange: (deviceType: string) => void;
  onAssetCategoryChange?: (category: AssetCategory) => void;
  write: boolean;
  departments: Department[];
};

export function DeviceInventoryForm({
  mode,
  form,
  set,
  onDeviceTypeChange,
  onAssetCategoryChange,
  write,
  departments,
}: DeviceInventoryFormProps) {
  const inputConditions = useMemo(() => peripheralConditions(), []);
  const screenConditionOptions = useMemo(() => screenConditions(), []);

  const upgradeComponentsSelected = useMemo(
    () =>
      String(form.upgradeComponents ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    [form.upgradeComponents],
  );
  const toggleUpgradeComponent = (component: string) => {
    const next = upgradeComponentsSelected.includes(component)
      ? upgradeComponentsSelected.filter((c) => c !== component)
      : [...upgradeComponentsSelected, component];
    set("upgradeComponents", next.join(","));
  };

  const recommendedActionsSelected = useMemo(
    () =>
      String(form.recommendedActions ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    [form.recommendedActions],
  );
  const toggleRecommendedAction = (action: string) => {
    const next = recommendedActionsSelected.includes(action)
      ? recommendedActionsSelected.filter((a) => a !== action)
      : [...recommendedActionsSelected, action];
    set("recommendedActions", next.join(","));
  };

  const overallAssessment = String(form.overallAssessment);
  const showsComponentChecklist =
    overallAssessment === "NEEDS_UPGRADE" || overallAssessment === "NEEDS_REPLACEMENT";
  const componentChecklistOptions = useMemo(
    () =>
      overallAssessment === "NEEDS_REPLACEMENT"
        ? [...REFERENCE_DATA.upgradeComponents, ...REFERENCE_DATA.replacementOnlyComponents]
        : [...REFERENCE_DATA.upgradeComponents],
    [overallAssessment],
  );
  const componentChecklistTitle = upgradeChecklistLabel(overallAssessment);
  const componentNotesLabel =
    overallAssessment === "NEEDS_REPLACEMENT"
      ? "Replacement Notes (specify other components or details)"
      : "Upgrade Notes (specify other components or details)";

  const ramPreview = useMemo(() => composeRam(form), [form]);
  const ramSlotsPreview = useMemo(() => composeRamSlots(form), [form]);
  const ramRecordedParts = useMemo(
    () =>
      [
        ramPreview ? `Memory: ${ramPreview}` : null,
        form.ramSlotsUsedCount && ramSlotsPreview ? `Slots: ${ramSlotsPreview}` : null,
      ].filter(Boolean) as string[],
    [form.ramSlotsUsedCount, ramPreview, ramSlotsPreview],
  );

  const primaryStoragePreview = useMemo(
    () =>
      composeStorage(String(form.primaryStorageType), String(form.primaryStorageSize), String(form.primaryStorageModel)) ||
      "—",
    [form.primaryStorageType, form.primaryStorageSize, form.primaryStorageModel],
  );

  const secondaryStoragePreview = useMemo(
    () =>
      form.hasSecondaryStorage
        ? composeStorage(
            String(form.secondaryStorageType),
            String(form.secondaryStorageSize),
            String(form.secondaryStorageModel),
          ) || "—"
        : "None",
    [
      form.hasSecondaryStorage,
      form.secondaryStorageType,
      form.secondaryStorageSize,
      form.secondaryStorageModel,
    ],
  );

  const powerPreview = useMemo(() => {
    const deviceType = String(form.deviceType);
    if (isLaptopDevice(deviceType)) {
      return composeLaptopPower(String(form.powerChargerStatus), String(form.powerBatteryStatus)) || "—";
    }
    if (isDesktopDevice(deviceType)) {
      return (
        composeDesktopPower(
          String(form.powerDesktopConnectionType),
          String(form.powerDesktopDetails),
          String(form.powerDesktopCondition),
        ) || "—"
      );
    }
    return "—";
  }, [
    form.deviceType,
    form.powerChargerStatus,
    form.powerBatteryStatus,
    form.powerDesktopConnectionType,
    form.powerDesktopDetails,
    form.powerDesktopCondition,
  ]);

  const keyboardPreview = useMemo(() => {
    const deviceType = String(form.deviceType);
    if (isLaptopDevice(deviceType)) {
      return (
        composeLaptopKeyboard(
          String(form.keyboardBuiltinCondition),
          String(form.keyboardBuiltinNotes),
          Boolean(form.hasExternalKeyboard),
          String(form.keyboardExternalModel),
          String(form.keyboardExternalCondition),
        ) || "—"
      );
    }
    return String(form.desktopKeyboardModel) || "—";
  }, [
    form.deviceType,
    form.keyboardBuiltinCondition,
    form.keyboardBuiltinNotes,
    form.hasExternalKeyboard,
    form.keyboardExternalModel,
    form.keyboardExternalCondition,
    form.desktopKeyboardModel,
  ]);

  const pointerPreview = useMemo(() => {
    const deviceType = String(form.deviceType);
    if (isLaptopDevice(deviceType)) {
      return (
        composeLaptopPointer(
          String(form.trackpadCondition),
          String(form.trackpadNotes),
          Boolean(form.hasExternalMouse),
          String(form.mouseExternalModel),
          String(form.mouseExternalCondition),
        ) || "—"
      );
    }
    return String(form.desktopMouseModel) || "—";
  }, [
    form.deviceType,
    form.trackpadCondition,
    form.trackpadNotes,
    form.hasExternalMouse,
    form.mouseExternalModel,
    form.mouseExternalCondition,
    form.desktopMouseModel,
  ]);

  const monitorPreview = useMemo(
    () =>
      composeMonitorRecord(
        String(form.deviceType),
        String(form.monitorPrimary),
        Boolean(form.hasSecondaryMonitor),
        String(form.monitorSecondary),
        String(form.monitorPrimaryCondition),
        String(form.monitorSecondaryCondition),
      ) || "—",
    [
      form.deviceType,
      form.monitorPrimary,
      form.monitorPrimaryCondition,
      form.hasSecondaryMonitor,
      form.monitorSecondary,
      form.monitorSecondaryCondition,
    ],
  );

  const printerPreview = useMemo(
    () =>
      composePeripheralPair(
        String(form.printerPrimary),
        Boolean(form.hasSecondaryPrinter),
        String(form.printerSecondary),
        String(form.printerPrimaryCondition),
        String(form.printerSecondaryCondition),
      ) || "—",
    [
      form.printerPrimary,
      form.printerPrimaryCondition,
      form.hasSecondaryPrinter,
      form.printerSecondary,
      form.printerSecondaryCondition,
    ],
  );

  const screenPreview = useMemo(() => {
    const dt = String(form.deviceType);
    const category = String(form.assetCategory || "end_user");
    const showDisplay =
      hasBuiltInScreen(dt) ||
      (category === "infrastructure" && showsInfraMonitorSpecs(dt));
    if (!showDisplay) return "—";
    const parts = [
      form.screenCondition ? formatCondition(String(form.screenCondition)) : "",
      String(form.screenNotes).trim(),
    ].filter(Boolean);
    return parts.join(" — ") || "—";
  }, [form.deviceType, form.assetCategory, form.screenCondition, form.screenNotes]);

  const assetCategory = String(form.assetCategory || "end_user") as AssetCategory;
  const deviceType = String(form.deviceType);
  const infra = mode === "asset" && assetCategory === "infrastructure";
  const infraServer = infra && showsInfraServerSpecs(deviceType);
  const infraNetwork = infra && showsInfraNetworkSpecs(deviceType);
  const infraStorage = infra && showsInfraStorageSpecs(deviceType);
  const infraMonitor = infra && showsInfraMonitorSpecs(deviceType);

  const departmentOptions = useMemo(() => {
    const unassigned =
      mode === "audit" &&
      (!String(form.employeeName).trim() ||
        /^unassigned$/i.test(String(form.employeeName).trim()));
    return [
      { value: "", label: unassigned ? "—" : "Select department..." },
      ...departments.map((d) => ({ value: d.id, label: d.name })),
    ];
  }, [departments, mode, form.employeeName]);
  const deviceTypeOptions = useMemo(() => {
    const source =
      mode === "asset"
        ? assetCategory === "infrastructure"
          ? REFERENCE_DATA.infrastructureDeviceTypes
          : REFERENCE_DATA.endUserDeviceTypes
        : REFERENCE_DATA.endUserDeviceTypes;
    return optionsFromStrings([...source], {
      emptyLabel: "Select device type...",
      labelFn: labelEnum,
    });
  }, [mode, assetCategory]);
  const employeeStatusOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.employeeStatuses], { emptyLabel: "—" }),
    [],
  );

  const assetStatusOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.assetStatuses], { labelFn: labelEnum }),
    [],
  );
  const infraAssetStatusOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.infrastructureAssetStatuses], { labelFn: labelEnum }),
    [],
  );
  const conditionOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.conditions], { emptyLabel: "—" }),
    [],
  );
  const osLicenseOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.osLicenseStatuses], { emptyLabel: "—" }),
    [],
  );
  const auditStatusOptions = useMemo(() => optionsFromStrings([...REFERENCE_DATA.auditStatuses]), []);
  const assessmentOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.assessments], { emptyLabel: "—" }),
    [],
  );
  const priorityOptions = useMemo(
    () => optionsFromStrings([...REFERENCE_DATA.priorities], { emptyLabel: "—" }),
    [],
  );
  const recommendedActionOptions = useMemo(
    () => [...REFERENCE_DATA.recommendedActions],
    [],
  );
  const mouseConditionOptions = useMemo(
    () => optionsFromStrings(mouseConditions(), { emptyLabel: "—", labelFn: formatCondition }),
    [],
  );
  const screenConditionSelectOptions = useMemo(
    () => optionsFromStrings(screenConditionOptions, { emptyLabel: "Select condition...", labelFn: formatCondition }),
    [screenConditionOptions],
  );
  const inputConditionOptions = useMemo(
    () => [
      ...optionsFromStrings(inputConditions, { emptyLabel: "—", labelFn: formatCondition }),
      { value: "N_A", label: "N/A" },
    ],
    [inputConditions],
  );
  const ramSizeOptions = useMemo(() => optionsFromStrings(RAM_SIZES, { emptyLabel: "—" }), []);
  const ramTypeOptions = useMemo(() => optionsFromStrings(RAM_TYPES, { emptyLabel: "—" }), []);
  const ramSpeedOptions = useMemo(() => optionsFromStrings(RAM_SPEEDS, { emptyLabel: "—" }), []);
  const storageTypeOptions = useMemo(() => optionsFromStrings(STORAGE_TYPES, { emptyLabel: "—" }), []);
  const storageSizeOptions = useMemo(() => optionsFromStrings(STORAGE_SIZES, { emptyLabel: "—" }), []);
  const osOptions = useMemo(
    () => [
      { value: "", label: "Select operating system..." },
      ...OPERATING_SYSTEM_OPTIONS.map((os) => ({ value: os, label: os })),
      { value: "Other", label: "Other" },
    ],
    [],
  );
  const osEditionOptions = useMemo(() => {
    const editions = getOsEditionOptions(String(form.operatingSystem));
    return [
      { value: "", label: getOsEditionPlaceholder(String(form.operatingSystem)) },
      ...editions.map((edition) => ({ value: edition, label: edition })),
    ];
  }, [form.operatingSystem]);
  const powerConnectionOptions = useMemo(
    () => [
      { value: "", label: "—" },
      ...DESKTOP_POWER_CONNECTIONS.map((c) => ({ value: c.value, label: c.label, hint: c.hint })),
    ],
    [],
  );

  return (
    <div className="space-y-5">
      {mode === "asset" && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
          <Field label="Asset Category">
            <Select
              value={assetCategory}
              onChange={(v) => {
                const category = v as AssetCategory;
                set("assetCategory", category);
                onAssetCategoryChange?.(category);
              }}
              options={[
                { value: "end_user", label: "End User Device" },
                { value: "infrastructure", label: "Infrastructure" },
                { value: "spare_peripheral", label: "Spare / Shared Peripheral" },
              ]}
              disabled={!write}
            />
          </Field>
        </div>
      )}

      <FormSection
        id="audit-section-employee"
        title={infra ? "Ownership" : "Employee"}
        icon={User}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label={mode === "asset" ? "Assigned To" : "Employee Name"}
            required={mode === "audit"}
          >
            <input
              className={inputClass}
              value={String(form.employeeName)}
              onChange={(e) => set("employeeName", e.target.value)}
              placeholder={
                mode === "asset"
                  ? "Unassigned — leave blank for spare stock"
                  : "Unassigned — for available / spare PC"
              }
              required={mode === "audit"}
              readOnly={!write}
            />
          </Field>
          <Field
            label={infra ? "Owning Department" : "Department"}
            required={
              mode === "audit" &&
              !!String(form.employeeName).trim() &&
              !/^unassigned$/i.test(String(form.employeeName).trim())
            }
          >
            <Select
              value={String(form.departmentId)}
              onChange={(v) => set("departmentId", v)}
              options={departmentOptions}
              placeholder={
                mode === "audit" &&
                (!String(form.employeeName).trim() ||
                  /^unassigned$/i.test(String(form.employeeName).trim()))
                  ? "—"
                  : "Select department..."
              }
              disabled={!write}
            />
          </Field>
          {(mode === "audit" || (mode === "asset" && !infra)) && (
            <Field label="Job Title">
              <input
                className={inputClass}
                value={String(form.jobTitle)}
                onChange={(e) => set("jobTitle", e.target.value)}
                placeholder={
                  mode === "asset" && !String(form.employeeName).trim()
                    ? "—"
                    : mode === "audit" &&
                        (!String(form.employeeName).trim() ||
                          /^unassigned$/i.test(String(form.employeeName).trim()))
                      ? "—"
                      : undefined
                }
                readOnly={
                  !write ||
                  (mode === "asset" && !String(form.employeeName).trim()) ||
                  (mode === "audit" &&
                    (!String(form.employeeName).trim() ||
                      /^unassigned$/i.test(String(form.employeeName).trim())))
                }
              />
            </Field>
          )}
          {(mode === "audit" || (mode === "asset" && !infra)) && (
            <Field label="Employee Status">
              <Select
                value={String(form.employeeStatus)}
                onChange={(v) => set("employeeStatus", v)}
                options={employeeStatusOptions}
                disabled={
                  !write ||
                  (mode === "audit" &&
                    (!String(form.employeeName).trim() ||
                      /^unassigned$/i.test(String(form.employeeName).trim())))
                }
              />
            </Field>
          )}
          <Field label="Asset Status">
            <Select
              value={String(form.status)}
              onChange={(v) => set("status", v)}
              options={infra ? infraAssetStatusOptions : assetStatusOptions}
              disabled={!write}
            />
          </Field>
          {mode === "asset" && !infra && !String(form.employeeName).trim() && (
            <p className="md:col-span-2 text-xs text-slate-500">
              No assignee yet — keep asset status as <span className="text-slate-300">Available</span> or{" "}
              <span className="text-slate-300">Reserved</span>. Assign later via Edit.
            </p>
          )}
          {mode === "asset" && (
            <>
              <div className="md:col-span-2">
                <Field label="Notes">
                  {write ? (
                    <textarea
                      className={`${inputClass} min-h-[5rem] max-h-60 resize-y overflow-y-auto whitespace-pre-wrap break-words`}
                      rows={4}
                      value={String(form.notes)}
                      onChange={(e) => set("notes", e.target.value)}
                    />
                  ) : (
                    <div
                      className={`${inputClass} min-h-[5rem] max-h-60 overflow-y-auto whitespace-pre-wrap break-words text-slate-300`}
                      role="textbox"
                      aria-readonly
                    >
                      {String(form.notes).trim() || "—"}
                    </div>
                  )}
                </Field>
              </div>
            </>
          )}
        </div>
      </FormSection>

      <FormSection id="audit-section-device" title="Device" icon={Monitor}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={infra ? "Asset Name / Hostname" : "Computer Name"} required>
            <input
              className={inputClass}
              value={String(form.computerName)}
              onChange={(e) => set("computerName", e.target.value)}
              required
              readOnly={!write}
            />
          </Field>
          <Field label="Device Type">
            <Select
              value={deviceType}
              onChange={onDeviceTypeChange}
              options={deviceTypeOptions}
              placeholder="Select device type..."
              disabled={!write}
            />
          </Field>
          <Field label="Condition">
            <Select
              value={String(form.condition)}
              onChange={(v) => set("condition", v)}
              options={conditionOptions}
              disabled={!write}
            />
          </Field>
        </div>

        {infra && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Serial Number">
              <input
                className={inputClass}
                value={String(form.serialNumber)}
                onChange={(e) => set("serialNumber", e.target.value)}
                readOnly={!write}
              />
            </Field>
            <Field label="Location">
              <input
                className={inputClass}
                value={String(form.location)}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Server Room A, 2F IDF"
                readOnly={!write}
              />
            </Field>
            <Field label="Management IP">
              <input
                className={inputClass}
                value={String(form.managementIp)}
                onChange={(e) => set("managementIp", e.target.value)}
                placeholder="e.g. 10.0.1.50"
                readOnly={!write}
              />
            </Field>
            {showsRackSlot(deviceType) && (
              <Field label="Rack / Slot">
                <input
                  className={inputClass}
                  value={String(form.rackSlot)}
                  onChange={(e) => set("rackSlot", e.target.value)}
                  placeholder="e.g. Rack 3 / U12"
                  readOnly={!write}
                />
              </Field>
            )}
            {showsPortCount(deviceType) && (
              <Field label="Port Count">
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={String(form.portCount)}
                  onChange={(e) => set("portCount", e.target.value)}
                  placeholder="e.g. 24"
                  readOnly={!write}
                />
              </Field>
            )}
          </div>
        )}

        {!infra && (
        <Subsection title="Built-in Display">
          {hasBuiltInScreen(String(form.deviceType)) ? (
            <>
              <Field label="Display Condition">
                <Select
                  value={String(form.screenCondition)}
                  onChange={(v) => set("screenCondition", v)}
                  options={screenConditionSelectOptions}
                  placeholder="Select condition..."
                  disabled={!write}
                />
              </Field>
              <Field label="Issue Description">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={String(form.screenNotes)}
                  onChange={(e) => set("screenNotes", e.target.value)}
                  placeholder="e.g. dead pixels in lower-left corner, screen flickering, cracked panel, dim backlight"
                  readOnly={!write}
                />
              </Field>
              <p className="text-xs text-slate-500">Example: FAULTY — dead pixels, faint vertical line</p>
              <RecordedPreview label="Recorded display" value={screenPreview} />
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Built-in display assessment is available for <span className="text-slate-200">Laptop</span> and{" "}
              <span className="text-slate-200">All-in-One</span> devices. Select the appropriate Device Type above to
              continue.
            </p>
          )}
        </Subsection>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Brand / Model">
            <input
              className={inputClass}
              value={String(form.laptopBrandModel)}
              onChange={(e) => set("laptopBrandModel", e.target.value)}
              readOnly={!write}
            />
          </Field>
          {(!infra || infraServer) && (
          <Field label="Processor">
            <input
              className={inputClass}
              value={String(form.processor)}
              onChange={(e) => set("processor", e.target.value)}
              readOnly={!write}
            />
          </Field>
          )}
          {infraNetwork && (
          <Field label="MAC Address">
            <input
              className={inputClass}
              value={String(form.macAddress)}
              onChange={(e) => set("macAddress", e.target.value)}
              placeholder="e.g. 00:1A:2B:3C:4D:5E"
              readOnly={!write}
            />
          </Field>
          )}
        </div>

        {infraMonitor && (
        <Subsection title="Display">
          <Field label="Display Condition">
            <Select
              value={String(form.screenCondition)}
              onChange={(v) => set("screenCondition", v)}
              options={screenConditionSelectOptions}
              placeholder="Select condition..."
              disabled={!write}
            />
          </Field>
          <Field label="Issue Description">
            <textarea
              className={inputClass}
              rows={2}
              value={String(form.screenNotes)}
              onChange={(e) => set("screenNotes", e.target.value)}
              placeholder="e.g. dead pixels, flickering, cracked panel, dim backlight"
              readOnly={!write}
            />
          </Field>
          <RecordedPreview label="Recorded display" value={screenPreview} />
        </Subsection>
        )}

        {(!infra || infraServer) && (
        <Subsection title="Memory (RAM)">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Capacity">
              <Select value={String(form.ramSize)} onChange={(v) => set("ramSize", v)} options={ramSizeOptions} disabled={!write} />
            </Field>
            <Field label="Type">
              <Select value={String(form.ramType)} onChange={(v) => set("ramType", v)} options={ramTypeOptions} disabled={!write} />
            </Field>
            <Field label="Speed">
              <Select value={String(form.ramSpeed)} onChange={(v) => set("ramSpeed", v)} options={ramSpeedOptions} disabled={!write} />
            </Field>
          </div>
          {!infra && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Slots Used">
              <Select
                value={String(form.ramSlotsUsedCount)}
                onChange={(v) => set("ramSlotsUsedCount", v)}
                options={optionsFromStrings(["1", "2", "3", "4"], { emptyLabel: "—" })}
                disabled={!write}
              />
            </Field>
            <Field label="Total Slots">
              <Select
                value={String(form.ramSlotsTotal)}
                onChange={(v) => set("ramSlotsTotal", v)}
                options={optionsFromStrings(["1", "2", "4"])}
                disabled={!write}
              />
            </Field>
            <Field label="Form Factor">
              <Select
                value={String(form.ramFormFactor)}
                onChange={(v) => set("ramFormFactor", v)}
                options={[
                  { value: "SODIMM", label: "SODIMM", hint: "Laptop / All-in-One" },
                  { value: "DIMM", label: "DIMM", hint: "Desktop" },
                ]}
                disabled={!write}
              />
            </Field>
          </div>
          )}
          <RecordedPreview
            label="Recorded configuration"
            value={ramRecordedParts.length > 0 ? ramRecordedParts.join(" · ") : "—"}
          />
          <p className="text-xs text-slate-500">
            {infra
              ? "Optional hardware specs for servers."
              : "Laptops typically support 1–2 SODIMM slots; desktops typically support 2 or 4 DIMM slots. Select Device Type to apply recommended defaults."}
          </p>
        </Subsection>
        )}

        {(!infra || infraServer || infraStorage) && (
        <Subsection title="Storage">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Primary — Type">
              <Select
                value={String(form.primaryStorageType)}
                onChange={(v) => set("primaryStorageType", v)}
                options={storageTypeOptions}
                disabled={!write}
              />
            </Field>
            <Field label="Primary — Capacity">
              <Select
                value={String(form.primaryStorageSize)}
                onChange={(v) => set("primaryStorageSize", v)}
                options={storageSizeOptions}
                disabled={!write}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Primary — Brand / Model">
                <input
                  className={inputClass}
                  value={String(form.primaryStorageModel)}
                  onChange={(e) => set("primaryStorageModel", e.target.value)}
                  placeholder="e.g. Samsung 980 Pro, WD Blue SN570, Seagate Barracuda"
                  readOnly={!write}
                />
              </Field>
            </div>
          </div>
          <RecordedPreview label="Recorded primary storage" value={primaryStoragePreview} />

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(form.hasSecondaryStorage)}
              onChange={(e) => set("hasSecondaryStorage", e.target.checked)}
              disabled={!write}
              className="rounded border-slate-600"
            />
            Add secondary storage (HDD / SATA SSD / NVMe SSD)
          </label>

          {form.hasSecondaryStorage && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Secondary — Type">
                <Select
                  value={String(form.secondaryStorageType)}
                  onChange={(v) => set("secondaryStorageType", v)}
                  options={storageTypeOptions}
                  disabled={!write}
                />
              </Field>
              <Field label="Secondary — Capacity">
                <Select
                  value={String(form.secondaryStorageSize)}
                  onChange={(v) => set("secondaryStorageSize", v)}
                  options={storageSizeOptions}
                  disabled={!write}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Secondary — Brand / Model">
                  <input
                    className={inputClass}
                    value={String(form.secondaryStorageModel)}
                    onChange={(e) => set("secondaryStorageModel", e.target.value)}
                    placeholder="e.g. Kingston A400, Toshiba HDD"
                    readOnly={!write}
                  />
                </Field>
              </div>
            </div>
          )}
          {form.hasSecondaryStorage && (
            <RecordedPreview label="Recorded secondary storage" value={secondaryStoragePreview} />
          )}
          {infraStorage && (
            <p className="text-xs text-slate-500">Record the external drive capacity, type, and model.</p>
          )}
        </Subsection>
        )}

        {(!infra || infraServer) && (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={form.hasSecondaryGpu ? "Primary Graphics Card / GPU" : "Graphics Card / GPU"}>
              <input
                className={inputClass}
                value={String(form.graphicsGpu)}
                onChange={(e) => set("graphicsGpu", e.target.value)}
                placeholder="e.g. NVIDIA RTX 3060, Intel UHD Graphics 620"
                readOnly={!write}
              />
            </Field>
            <Field label="Network (Wi-Fi/Ethernet)">
              <input
                className={inputClass}
                value={String(form.network)}
                onChange={(e) => set("network", e.target.value)}
                placeholder="e.g. Intel Wi-Fi 6 AX201, Realtek PCIe GbE"
                readOnly={!write}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(form.hasSecondaryGpu)}
              onChange={(e) => set("hasSecondaryGpu", e.target.checked)}
              disabled={!write}
              className="rounded border-slate-600"
            />
            Add second graphics card
          </label>

          {form.hasSecondaryGpu && (
            <Field label="Secondary Graphics Card / GPU">
              <input
                className={inputClass}
                value={String(form.graphicsGpuSecondary)}
                onChange={(e) => set("graphicsGpuSecondary", e.target.value)}
                placeholder="e.g. NVIDIA RTX 4090, AMD Radeon RX 7900"
                readOnly={!write}
              />
            </Field>
          )}
        </div>
        )}

        {(infra ? showsInfraOs(deviceType) : true) && (
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Operating System">
            <Select
              value={String(form.operatingSystem)}
              onChange={(v) => {
                set("operatingSystem", v);
                if (!hasOsEdition(v)) set("operatingSystemEdition", "");
              }}
              options={osOptions}
              placeholder="Select operating system..."
              disabled={!write}
            />
          </Field>
          {hasOsEdition(String(form.operatingSystem)) && (
            <Field label={getOsEditionLabel(String(form.operatingSystem))}>
              <Select
                value={String(form.operatingSystemEdition)}
                onChange={(v) => set("operatingSystemEdition", v)}
                options={osEditionOptions}
                placeholder={getOsEditionPlaceholder(String(form.operatingSystem))}
                disabled={!write}
              />
            </Field>
          )}
          {form.operatingSystem === "Other" && (
            <Field label="Other Operating System">
              <input
                className={inputClass}
                value={String(form.operatingSystemOther)}
                onChange={(e) => set("operatingSystemOther", e.target.value)}
                placeholder="e.g. Windows Server 2019, Ubuntu 24.04 LTS"
                readOnly={!write}
              />
            </Field>
          )}
          {!infra && (
          <Field label="OS License Status">
            <Select
              value={String(form.osLicenseStatus)}
              onChange={(v) => set("osLicenseStatus", v)}
              options={osLicenseOptions}
              disabled={!write}
            />
          </Field>
          )}
        </div>
        )}

        {!infra && (
        <Subsection title="Power & Charging">
          {isLaptopDevice(String(form.deviceType)) ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Charger">
                  <Select
                    value={String(form.powerChargerStatus)}
                    onChange={(v) => set("powerChargerStatus", v)}
                    options={optionsFromStrings(CHARGER_STATUSES, { emptyLabel: "—" })}
                    disabled={!write}
                  />
                </Field>
                <Field label="Battery">
                  <Select
                    value={String(form.powerBatteryStatus)}
                    onChange={(v) => set("powerBatteryStatus", v)}
                    options={optionsFromStrings(BATTERY_STATUSES, { emptyLabel: "—" })}
                    disabled={!write}
                  />
                </Field>
              </div>
              <p className="text-xs text-slate-500">Example: Good Charger / Battery Status: Requires Replacement</p>
            </>
          ) : isDesktopDevice(String(form.deviceType)) ? (
            <>
              <Field label="Power Connection">
                <Select
                  value={String(form.powerDesktopConnectionType)}
                  onChange={(v) => set("powerDesktopConnectionType", v)}
                  options={powerConnectionOptions}
                  disabled={!write}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Brand / Model / Notes">
                  <input
                    className={inputClass}
                    value={String(form.powerDesktopDetails)}
                    onChange={(e) => set("powerDesktopDetails", e.target.value)}
                    placeholder="e.g. Secure 220V Generic AVR, APC 650VA UPS"
                    readOnly={!write}
                  />
                </Field>
                {(form.powerDesktopConnectionType === "AVR" || form.powerDesktopConnectionType === "UPS") && (
                  <Field label="AVR / UPS Condition">
                    <Select
                      value={String(form.powerDesktopCondition)}
                      onChange={(v) => set("powerDesktopCondition", v)}
                      options={inputConditionOptions.filter((o) => o.value !== "N_A")}
                      disabled={!write}
                    />
                  </Field>
                )}
              </div>
              <p className="text-xs text-slate-500">Example: AVR — Secure 220V Generic AVR — GOOD</p>
            </>
          ) : (
            <p className="text-xs text-slate-400">Select Device Type to configure power and charging settings.</p>
          )}

          <RecordedPreview label="Recorded power configuration" value={powerPreview} />
        </Subsection>
        )}

        {!infra && (
        <Subsection title={hasBuiltInScreen(deviceType) ? "External Monitor" : "Monitor"}>
          {hasBuiltInScreen(deviceType) && (
            <p className="text-xs text-slate-500">
              Document external monitors here. The built-in display is recorded in the Built-in Display section above.
            </p>
          )}
          <Field
            label={
              hasBuiltInScreen(String(form.deviceType))
                ? "External Monitor — Brand / Model / Size"
                : "Primary Monitor — Brand / Model / Size"
            }
          >
            <input
              className={inputClass}
              value={String(form.monitorPrimary)}
              onChange={(e) => set("monitorPrimary", e.target.value)}
              placeholder={
                hasBuiltInScreen(String(form.deviceType))
                  ? "e.g. Dell P2422H 24-inch (connected via HDMI / USB-C)"
                  : "e.g. Dell P2422H 24-inch"
              }
              readOnly={!write}
            />
          </Field>
          <Field
            label={
              hasBuiltInScreen(String(form.deviceType))
                ? "External Monitor — Condition"
                : "Primary Monitor — Condition"
            }
          >
            <Select
              value={String(form.monitorPrimaryCondition)}
              onChange={(v) => set("monitorPrimaryCondition", v)}
              options={inputConditionOptions.filter((o) => o.value !== "N_A")}
              disabled={!write}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(form.hasSecondaryMonitor)}
              onChange={(e) => set("hasSecondaryMonitor", e.target.checked)}
              disabled={!write}
              className="rounded border-slate-600"
            />
            {hasBuiltInScreen(String(form.deviceType))
              ? "Second external monitor connected"
              : "Second monitor connected (dual display setup)"}
          </label>
          {form.hasSecondaryMonitor && (
            <>
              <Field
                label={
                  hasBuiltInScreen(String(form.deviceType))
                    ? "Second External Monitor — Brand / Model / Size"
                    : "Secondary Monitor — Brand / Model / Size"
                }
              >
                <input
                  className={inputClass}
                  value={String(form.monitorSecondary)}
                  onChange={(e) => set("monitorSecondary", e.target.value)}
                  placeholder="e.g. LG 24MK430 24-inch"
                  readOnly={!write}
                />
              </Field>
              <Field
                label={
                  hasBuiltInScreen(String(form.deviceType))
                    ? "Second External Monitor — Condition"
                    : "Secondary Monitor — Condition"
                }
              >
                <Select
                  value={String(form.monitorSecondaryCondition)}
                  onChange={(v) => set("monitorSecondaryCondition", v)}
                  options={inputConditionOptions.filter((o) => o.value !== "N_A")}
                  disabled={!write}
                />
              </Field>
            </>
          )}
          <RecordedPreview label="Recorded monitor(s)" value={monitorPreview} />
        </Subsection>
        )}
      </FormSection>

      {!infra && (
      <FormSection id="audit-section-peripherals" title="Peripherals" icon={Mouse}>
        {isLaptopDevice(String(form.deviceType)) ? (
          <div className="space-y-4">
            <Subsection title="Keyboard">
              <Field label="Built-in Keyboard Condition">
                <Select
                  value={String(form.keyboardBuiltinCondition)}
                  onChange={(v) => set("keyboardBuiltinCondition", v)}
                  options={inputConditionOptions}
                  disabled={!write}
                />
              </Field>
              {isInputIssueCondition(String(form.keyboardBuiltinCondition)) && (
                <Field label="Issue Notes / Recommendation">
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={String(form.keyboardBuiltinNotes)}
                    onChange={(e) => set("keyboardBuiltinNotes", e.target.value)}
                    placeholder="e.g. Space bar not responding; recommend keyboard replacement or use external USB keyboard"
                    readOnly={!write}
                  />
                </Field>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(form.hasExternalKeyboard)}
                  onChange={(e) => set("hasExternalKeyboard", e.target.checked)}
                  disabled={!write}
                  className="rounded border-slate-600"
                />
                External USB keyboard connected
              </label>
              {form.hasExternalKeyboard && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="External Keyboard — Brand / Model">
                    <input
                      className={inputClass}
                      value={String(form.keyboardExternalModel)}
                      onChange={(e) => set("keyboardExternalModel", e.target.value)}
                      placeholder="e.g. Logitech K120"
                      readOnly={!write}
                    />
                  </Field>
                  <Field label="External Keyboard — Condition">
                    <Select
                      value={String(form.keyboardExternalCondition)}
                      onChange={(v) => set("keyboardExternalCondition", v)}
                      options={inputConditionOptions.filter((o) => o.value !== "N_A")}
                      disabled={!write}
                    />
                  </Field>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Example: Built-in — FAULTY — Notes: Sticky keys; recommend replacement
              </p>
              <RecordedPreview label="Recorded keyboard" value={keyboardPreview} />
            </Subsection>

            <Subsection title="Mouse / Trackpad">
              <Field label="Built-in Trackpad Condition">
                <Select
                  value={String(form.trackpadCondition)}
                  onChange={(v) => set("trackpadCondition", v)}
                  options={inputConditionOptions}
                  disabled={!write}
                />
              </Field>
              {isInputIssueCondition(String(form.trackpadCondition)) && (
                <Field label="Issue Notes / Recommendation">
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={String(form.trackpadNotes)}
                    onChange={(e) => set("trackpadNotes", e.target.value)}
                    placeholder="e.g. Erratic cursor movement; recommend driver update or external mouse"
                    readOnly={!write}
                  />
                </Field>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(form.hasExternalMouse)}
                  onChange={(e) => set("hasExternalMouse", e.target.checked)}
                  disabled={!write}
                  className="rounded border-slate-600"
                />
                External USB mouse connected
              </label>
              {form.hasExternalMouse && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="External Mouse — Brand / Model">
                    <input
                      className={inputClass}
                      value={String(form.mouseExternalModel)}
                      onChange={(e) => set("mouseExternalModel", e.target.value)}
                      placeholder="e.g. Logitech M100"
                      readOnly={!write}
                    />
                  </Field>
                  <Field label="External Mouse — Condition">
                    <Select
                      value={String(form.mouseExternalCondition)}
                      onChange={(v) => set("mouseExternalCondition", v)}
                      options={mouseConditionOptions}
                      disabled={!write}
                    />
                  </Field>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Example: Built-in Trackpad — FAULTY — Notes: Unresponsive clicks; recommend external mouse
              </p>
              <RecordedPreview label="Recorded pointer device" value={pointerPreview} />
            </Subsection>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Keyboard — Brand / Model">
              <input
                className={inputClass}
                value={String(form.desktopKeyboardModel)}
                onChange={(e) => set("desktopKeyboardModel", e.target.value)}
                placeholder="e.g. Wired USB keyboard, Logitech MK270"
                readOnly={!write}
              />
            </Field>
            <Field label="Keyboard Condition">
              <Select
                value={String(form.keyboardCondition)}
                onChange={(v) => set("keyboardCondition", v)}
                options={inputConditionOptions.filter((o) => o.value !== "N_A")}
                disabled={!write}
              />
            </Field>
            <Field label="Mouse — Brand / Model">
              <input
                className={inputClass}
                value={String(form.desktopMouseModel)}
                onChange={(e) => set("desktopMouseModel", e.target.value)}
                placeholder="e.g. USB optical mouse"
                readOnly={!write}
              />
            </Field>
            <Field label="Mouse Condition">
              <Select
                value={String(form.mouseCondition)}
                onChange={(v) => set("mouseCondition", v)}
                options={mouseConditionOptions}
                disabled={!write}
              />
            </Field>
          </div>
        )}

        <div className="space-y-4">
          <Subsection title="Printer">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Primary Printer — Brand / Model">
                <input
                  className={inputClass}
                  value={String(form.printerPrimary)}
                  onChange={(e) => set("printerPrimary", e.target.value)}
                  placeholder="e.g. HP LaserJet Pro M404dn"
                  readOnly={!write}
                />
              </Field>
              <Field label="Primary Printer — Condition">
                <Select
                  value={String(form.printerPrimaryCondition)}
                  onChange={(v) => set("printerPrimaryCondition", v)}
                  options={inputConditionOptions.filter((o) => o.value !== "N_A")}
                  disabled={!write}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(form.hasSecondaryPrinter)}
                onChange={(e) => set("hasSecondaryPrinter", e.target.checked)}
                disabled={!write}
                className="rounded border-slate-600"
              />
              Second printer connected
            </label>
            {form.hasSecondaryPrinter && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Secondary Printer — Brand / Model">
                  <input
                    className={inputClass}
                    value={String(form.printerSecondary)}
                    onChange={(e) => set("printerSecondary", e.target.value)}
                    placeholder="e.g. Canon PIXMA TS3450"
                    readOnly={!write}
                  />
                </Field>
                <Field label="Secondary Printer — Condition">
                  <Select
                    value={String(form.printerSecondaryCondition)}
                    onChange={(v) => set("printerSecondaryCondition", v)}
                    options={inputConditionOptions.filter((o) => o.value !== "N_A")}
                    disabled={!write}
                  />
                </Field>
              </div>
            )}
            <RecordedPreview label="Recorded printer(s)" value={printerPreview} />
          </Subsection>
        </div>
      </FormSection>
      )}

      {mode === "audit" && (
        <FormSection id="audit-section-audit" title="Audit" icon={ClipboardCheck}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Audit Date">
              <input
                type="date"
                className={inputClass}
                value={String(form.auditDate)}
                onChange={(e) => set("auditDate", e.target.value)}
                readOnly={!write}
              />
            </Field>
            <Field label="Audit Status">
              <Select
                value={String(form.auditStatus)}
                onChange={(v) => set("auditStatus", v)}
                options={auditStatusOptions}
                disabled={!write}
              />
            </Field>
            <Field label="Overall Assessment">
              <Select
                value={String(form.overallAssessment)}
                onChange={(v) => set("overallAssessment", v)}
                options={assessmentOptions}
                disabled={!write}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={String(form.priority)}
                onChange={(v) => set("priority", v)}
                options={priorityOptions}
                disabled={!write}
              />
            </Field>
            <Field label="Findings Summary">
              <textarea
                className={inputClass}
                rows={3}
                value={String(form.findingsSummary)}
                onChange={(e) => set("findingsSummary", e.target.value)}
                readOnly={!write}
              />
            </Field>
            <Field label="Recommended Action">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {recommendedActionOptions.map((action) => (
                  <label key={action} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={recommendedActionsSelected.includes(action)}
                      onChange={() => toggleRecommendedAction(action)}
                      disabled={!write}
                      className="rounded border-slate-600"
                    />
                    {labelEnum(action)}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {showsComponentChecklist && (
            <Subsection title={componentChecklistTitle}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {componentChecklistOptions.map((component) => (
                  <label key={component} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={upgradeComponentsSelected.includes(component)}
                      onChange={() => toggleUpgradeComponent(component)}
                      disabled={!write}
                      className="rounded border-slate-600"
                    />
                    {labelEnum(component)}
                  </label>
                ))}
              </div>
              <Field label={componentNotesLabel}>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={String(form.upgradeNotes)}
                  onChange={(e) => set("upgradeNotes", e.target.value)}
                  readOnly={!write}
                />
              </Field>
            </Subsection>
          )}
        </FormSection>
      )}
    </div>
  );
}

export default DeviceInventoryForm;
