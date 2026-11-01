import { useMemo, useState } from "react";
import { CardIndex, buildCardIndexConfig } from "../../../../components/card/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { useLibraryLocale, type Localized } from "../../../library/locale";
import EveilMark from "../EveilMark";
import { DeskSetting, Scene, SceneDesk, deskOptions } from "../scene/Scene";

/* The studio's pages as an index (the library index's own cards), the dummy
   client's eye on the veiled covers. The desk sets the two choices that
   change the layout: desktop columns and the order orbs. */

type Columns = "two" | "three";
type Order = "numbered" | "free";

const T = {
  fr: {
    name: "Sommaire",
    when: "Quand le site s'ouvre sur ses pages (services, collections, rubriques) : chaque carte mène à la sienne, l'image voilée sous l'emblème du client jusqu'au survol.",
    columns: { label: "Colonnes", options: { two: "Deux", three: "Trois" } },
    order: { label: "Ordre", options: { numbered: "Numéros", free: "Libre" } },
  },
  en: {
    name: "Index",
    when: "When the site opens onto its pages (services, collections, sections): each card leads to its own, the picture veiled under the client's emblem until hovered.",
    columns: { label: "Columns", options: { two: "Two", three: "Three" } },
    order: { label: "Order", options: { numbered: "Numbers", free: "Free" } },
  },
} satisfies Localized<unknown>;

/* Fictional destinations: a plain click keeps the page. */
const keepPage = () => {};

export default function IndexScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => buildCardIndexConfig(locale), [locale]);
  const [columns, setColumns] = useState<Columns>("two");
  const [order, setOrder] = useState<Order>("numbered");

  return (
    <Scene
      name={t.name}
      when={t.when}
      tone="light"
      rhythm="standard"
      desk={
        <SceneDesk>
          <DeskSetting label={t.columns.label}>
            <SegmentedControl
              block
              label={t.columns.label}
              options={deskOptions(t.columns.options)}
              value={columns}
              onChange={(v) => setColumns(v as Columns)}
            />
          </DeskSetting>
          <DeskSetting label={t.order.label}>
            <SegmentedControl
              block
              label={t.order.label}
              options={deskOptions(t.order.options)}
              value={order}
              onChange={(v) => setOrder(v as Order)}
            />
          </DeskSetting>
        </SceneDesk>
      }
    >
      <CardIndex
        id="card-index"
        index={config.indexes.site}
        copy={config.copy}
        columns={columns === "two" ? 2 : 3}
        numbered={order === "numbered"}
        mark={<EveilMark />}
        tone="light"
        onOpen={keepPage}
      />
    </Scene>
  );
}
