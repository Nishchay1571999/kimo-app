import type { LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type HeatmapCell = {
  day: number | null;
  intensity: number;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthName(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function createHeatmap(
  month: Date,
  activity: number[],
): HeatmapCell[][] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const daysInMonth = new Date(
    year,
    monthIndex + 1,
    0,
  ).getDate();

  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;

  const totalCells = startOffset + daysInMonth;
  const numberOfWeeks = Math.ceil(totalCells / 7);

  const weeks: HeatmapCell[][] = Array.from(
    { length: numberOfWeeks },
    () =>
      Array.from({ length: 7 }, () => ({
        day: null,
        intensity: 0,
      })),
  );

  for (let day = 1; day <= daysInMonth; day++) {
    const index = startOffset + day - 1;

    const weekIndex = Math.floor(index / 7);
    const weekDay = index % 7;

    weeks[weekIndex][weekDay] = {
      day,
      intensity: activity[(day - 1) % activity.length] ?? 0,
    };
  }

  return weeks;
}

type HeatmapProps = {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  iconBackground: string;
  colors: string[];
  activity: number[];
  month: Date;
  orientation?: 'weeks-horizontal' | 'days-horizontal';
};

export function ContributionHeatmap({
  title,
  icon: Icon,
  iconColor,
  iconBackground,
  colors,
  activity,
  month,
  orientation = 'weeks-horizontal',
}: HeatmapProps) {
  const daysHorizontal = orientation === 'days-horizontal';
  const weeks = useMemo(
    () => createHeatmap(month, activity),
    [month, activity],
  );

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.activityTitleContainer}>
          <View
            style={[
              styles.sectionIcon,
              { backgroundColor: iconBackground },
            ]}
          >
            <Icon
              size={21}
              color={iconColor}
            />
          </View>

          <View style={styles.activityHeading}>
            <Text style={styles.activityTitle}>{title}</Text>
            <Text style={styles.monthText}>{getMonthName(month)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.heatmapContainer, daysHorizontal && styles.centeredHeatmap]}>
        <View style={[styles.dayLabels, daysHorizontal && styles.horizontalDayLabels]}>
          {DAYS.map((day) => (
            <View key={day} style={[styles.dayLabelContainer, daysHorizontal && styles.horizontalDayLabel]}>
              <Text style={styles.dayLabel}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.weeks, daysHorizontal && styles.verticalWeeks]}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={[styles.week, daysHorizontal && styles.horizontalWeek]}>
              {week.map((cell, dayIndex) => (
                <View
                  key={`${weekIndex}-${dayIndex}`}
                  accessible={cell.day !== null}
                  accessibilityLabel={
                    cell.day === null
                      ? undefined
                      : `${title}, ${month.toLocaleDateString('en-US', { month: 'long' })} ${cell.day}, ${month.getFullYear()}, activity level ${cell.intensity} of ${colors.length - 1}`
                  }
                  style={[
                    styles.heatCell,
                    {
                      backgroundColor:
                        cell.day === null
                          ? "transparent"
                          : colors[cell.intensity],
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.legend, daysHorizontal && styles.centeredLegend]}>
        <Text style={styles.legendText}>Less</Text>

        <View style={styles.legendBlocks}>
          {colors.map((color, index) => (
            <View
              key={index}
              style={[
                styles.legendCell,
                { backgroundColor: color },
              ]}
            />
          ))}
        </View>

        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EDEDEE',
  },
  activityHeader: { marginBottom: 20 },
  activityTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityHeading: { flex: 1, gap: 3 },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#17171A',
  },
  monthText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#60646C',
  },
  heatmapContainer: { flexDirection: 'row', gap: 12 },
  centeredHeatmap: { flexDirection: 'column', alignSelf: 'center', gap: 6 },
  horizontalDayLabels: { width: 'auto', flexDirection: 'row' },
  horizontalDayLabel: { width: 22, alignItems: 'center' },
  verticalWeeks: { flexDirection: 'column' },
  horizontalWeek: { flexDirection: 'row' },
  dayLabels: { width: 30, gap: 6 },
  dayLabelContainer: { height: 22, justifyContent: 'center' },
  dayLabel: { fontSize: 10, color: '#60646C' },
  weeks: { flexDirection: 'row', gap: 6 },
  week: { gap: 6 },
  heatCell: { width: 22, height: 22, borderRadius: 5 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    marginLeft: 42,
  },
  legendBlocks: { flexDirection: 'row', gap: 4 },
  centeredLegend: { marginLeft: 0, justifyContent: 'center' },
  legendCell: { width: 12, height: 12, borderRadius: 3 },
  legendText: { color: '#60646C', fontSize: 11 },
});
