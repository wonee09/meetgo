import { Chip, Select, SelectItem } from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { favoriteOptions } from '@/utils/FavoriteData';
import { clientSupabase } from '@/utils/supabase/client';
import { IsEditingType } from '@/types/userTypes';
import { useGetUserDataQuery } from '@/hooks/useQueries/useUserQuery';
import { useFavoriteStore } from '@/store/userStore';

const Favorite: React.FC<IsEditingType> = ({ isEditing }) => {
  const { selected, setSelected } = useFavoriteStore();
  const { data: user } = useGetUserDataQuery();

  const handleSelect = (value: string) => {
    if (selected.size >= 5) {
      alert('최대 5개까지 선택 가능합니다.');
      return;
    }
    setSelected(new Set(value));
  };

  const handleDelete = (value: string) => {
    const newSelected = new Set(selected);
    newSelected.delete(value);
    setSelected(newSelected);
  };

  useEffect(() => {
    const initialFavorites = new Set(user?.favorite || []);
    setSelected(initialFavorites);
  }, [user]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full gap-6">
        <label className="block text-lg font-semibold w-[100px]">이상형</label>
        <div className="flex gap-2">
          {Array.from(selected).map((value) => (
            <Chip
              key={value}
              color="default"
              style={{ backgroundColor: favoriteOptions.find((option) => option.value === value)?.color }}
              {...(isEditing ? { onClose: () => handleDelete(value) } : {})}
            >
              {value}
            </Chip>
          ))}
        </div>
      </div>
      {isEditing ? (
        <div className="flex whitespace-nowrap">
          <Select
            label="이상형 선택(최대 5개)"
            selectionMode="multiple"
            variant="bordered"
            selectedKeys={selected}
            className="max-w-xs"
            aria-label="이상형 선택"
            onSelectionChange={(value) => handleSelect(value as string)}
          >
            {favoriteOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.value}
              </SelectItem>
            ))}
          </Select>
        </div>
      ) : null}
    </div>
  );
};

export default Favorite;
