import "../foundation";
import "./controls.css";

export { PrimaryPlate, GhostAction, GlassClose, PagerOrb } from "./Commands";
export type { PrimaryPlateProps, GhostActionProps, GlassCloseProps, PagerOrbProps } from "./Commands";
export { OptionChip, OptionRow, ChipGroup, OptionRows, CheckOrb, StepMark, Tag, Badge, rovingKeyDown } from "./Choices";
export type { OptionChipProps, OptionRowProps, ChipGroupProps, OptionRowsProps, ChoiceOption, StepState, TagProps } from "./Choices";
export { UnderlineField, FieldGrid, Switch, SegmentedControl } from "./Fields";
export type { UnderlineFieldProps, SwitchProps, SegmentedControlProps, SegmentOption } from "./Fields";
export { SegmentedProgress } from "./Progress";
export type { SegmentedProgressProps, ProgressCellState } from "./Progress";
export { ControlsProvider, useControlsCopy } from "./copy";
export { buildControlsConfig, type ControlsConfig, type ControlsCopy, type Locale } from "./controls.config";
