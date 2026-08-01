import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/constants/theme';
import SwipeableSheet from '@/components/SwipeableSheet';
import { useSheetStyles } from './sheetStyles';

export interface FilterableSection {
  id: string;
  title: string;
  icon?: string;
  filter: any;
}

interface Props {
  visible: boolean;
  sections: FilterableSection[];
  activeId: string | null;
  onChange: (id: string | null) => void;
  onClose: () => void;
}

/** Sheet listing the server-configured "filterable" sections (curated feeds
 *  that Explore can jump into). "Todos" resets to the free search. */
export default function SectionPickerSheet({
  visible,
  sections,
  activeId,
  onChange,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const styles = useSheetStyles();

  return (
    <SwipeableSheet visible={visible} onClose={onClose} title="Filtros">
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
        {sections.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.option}
              activeOpacity={0.7}
              onPress={() => {
                onChange(null);
                onClose();
              }}>
              <Text style={[styles.optionText, !activeId && styles.optionActive]}>
                Todos
              </Text>
              {!activeId && <Check size={18} color={colors.primary} strokeWidth={2.2} />}
            </TouchableOpacity>
            {sections.map((sec) => {
              const active = activeId === sec.id;
              return (
                <TouchableOpacity
                  key={sec.id}
                  style={styles.option}
                  activeOpacity={0.7}
                  onPress={() => {
                    onChange(sec.id);
                    onClose();
                  }}>
                  <Text style={[styles.optionText, active && styles.optionActive]}>
                    {sec.title}
                  </Text>
                  {active && <Check size={18} color={colors.primary} strokeWidth={2.2} />}
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SwipeableSheet>
  );
}
