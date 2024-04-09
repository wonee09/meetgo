'use client';
import participantsHandler from '(@/hooks/custom/participants)';
import meetingRoomHandler from '(@/hooks/custom/room)';
import { userStore } from '(@/store/userStore)';
import { clientSupabase } from '(@/utils/supabase/client)';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { UUID } from 'crypto';

const AcceptanceRoomButtons = ({ roomId }: { roomId: UUID }) => {
  const router = useRouter();
  const { user, participants } = userStore((state) => state);
  const [maximumParticipants, setMaximumParticipants] = useState(0);
  const { deleteMember } = participantsHandler();
  const { getRoomInformation, getmaxGenderMemberNumber } = meetingRoomHandler();

  useEffect(() => {
    // 방의 정보를 가져옵니다.
    const getSingleRoom = async () => {
      const singleRoom = await getRoomInformation(roomId);
      if (!singleRoom) {
        return;
      }
      //방에 최대 인원은 얼마나 들어갈 수 있는지 확인합니다.
      const maximumGenderParticipants = await getmaxGenderMemberNumber(singleRoom[0].member_number);
      if (!maximumGenderParticipants) return;
      setMaximumParticipants(maximumGenderParticipants * 2);
    };
    getSingleRoom();
  }, []);

  const gotoChattingRoom = async () => {
    if (!user) {
      alert('로그인 후에 이용하세요.');
      router.push('/users/login');
    }

    const { data: alreadyChat } = await clientSupabase
      .from('chatting_room')
      .select('*')
      .eq('room_id', roomId)
      .eq('isActive', true);
    if (alreadyChat && alreadyChat?.length) {
      // 만약 isActive인 채팅방이 이미 있다면 그 방으로 보내기
      router.replace(`/chat/${alreadyChat[0].chatting_room_id}`);
    } else {
      // 없으면 새로 만들어주기
      const { data: chat_room, error } = await clientSupabase
        .from('chatting_room')
        .insert({
          room_id: roomId,
          isActive: true
        })
        .select('chatting_room_id');
      console.log(chat_room);

      if (chat_room) router.replace(`/chat/${chat_room[0].chatting_room_id}`);
    } // "/chatting_room_id" 로 주소값 변경
  };

  //나가기를 클릭하면 로비로 이동합니다.
  const gotoLobby = async () => {
    //로비로 나가는 사람이 생기면 방은 다시 모집중으로 바뀝니다.
    await clientSupabase.from('room').update({ room_status: '모집중' }).eq('room_id', roomId);
    //참가자 테이블에서 해당 유저의 정보가 삭제됩니다.
    const user_id = user[0].user_id;
    await deleteMember(user_id);
    //유저가 리더였다면 다른 사람에게 리더 역할이 승계됩니다.
    //방을 생성할 때 리더는 자동으로 할당되어 초기값은 방 생성자입니다.
    //리더는 유일하므로 1 이외의 값은 없습니다.
    if (!participants) return;
    const { data: leader } = await clientSupabase.from('room').select('*').eq('room_id', roomId);
    if (!leader) return;
    if (leader.length === 1 && leader[0].leader_id === user[0].user_id && participants.length !== 1) {
      const otherParticipants = participants.filter((person) => person.user_id !== leader[0].leader_id);
      await clientSupabase.from('room').update({ leader_id: otherParticipants[0].user_id }).eq('room_id', roomId);
    }
    //만약 유일한 참여자라면 나감과 동시에 방은 삭제됩니다.
    if (participants.length === 0) {
      await clientSupabase.from('room').delete().eq('room_id', roomId);
    }
    router.push(`/meetingRoom`);
  };

  return (
    <div className="h-100 w-16 flex flex-col justify-end gap-8">
      <button
        onClick={() => {
          gotoLobby();
        }}
      >
        나가기
      </button>
      <button
        // disabled={participants?.length === maximumParticipants ? false : true}
        onClick={() => gotoChattingRoom()}
      >
        go to chat
      </button>
    </div>
  );
};

export default AcceptanceRoomButtons;
