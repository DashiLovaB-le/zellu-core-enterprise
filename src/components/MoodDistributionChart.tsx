import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { buildWeeklyMoodBars } from "@/data/moods";

interface Props {
  distribution: Record<string, number>;
  height: number;
  tickFontSize: number;
}

export function MoodDistributionChart({ distribution, height, tickFontSize }: Props) {
  const data = useMemo(() => buildWeeklyMoodBars(distribution), [distribution]);
  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="w-full min-w-0">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
          <XAxis
            type="number"
            domain={[0, 7]}
            ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
            allowDecimals={false}
            tick={{ fontSize: tickFontSize }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="mood"
            tick={{ fontSize: tickFontSize }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            formatter={(value: number | string) => {
              const n = Number(value) || 0;
              return [`${n} ${n === 1 ? "dia" : "dias"}`, "Essa semana"];
            }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="count" name="Dias" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-[var(--clay-title)]/50">
        {total === 0
          ? "Cada check-in preenche uma barra. Humores extras entram na categoria mais próxima."
          : `${total} ${total === 1 ? "dia registrado" : "dias registrados"} nesta semana`}
      </p>
    </div>
  );
}
