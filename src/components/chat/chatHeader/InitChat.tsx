'use client';
import { useRoomDataQuery } from '@/hooks/useQueries/useChattingQuery';
import { chatStore } from '@/store/chatStore';
import { Message, chatRoomPayloadType } from '@/types/chatTypes';
import { ITEM_INTERVAL } from '@/utils/constant';
import { clientSupabase } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import ChatList from '../chatBody/ChatList';
import ChatInput from '../chatFooter/ChatInput';

const InitChat = ({ user, chatRoomId, allMsgs }: { user: User | null; chatRoomId: string; allMsgs: Message[] }) => {
  const router = useRouter();
  const { messages, chatState, isRest, setChatState, setMessages, setChatRoomId, setHasMore } = chatStore(
    (state) => state
  );
  const room = useRoomDataQuery(chatRoomId);
  const roomId = room?.roomId;
  // console.log('allMsgs => ', allMsgs);
  useEffect(() => {
    // 채팅방 isActive 상태 구독
    const channel = clientSupabase
      .channel(`${chatRoomId}_chatting_room_table`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chatting_room', filter: `chatting_room_id=eq.${chatRoomId}` },
        (payload) => {
          console.log(payload.new);
          setChatState((payload.new as chatRoomPayloadType).isActive);
        }
      )
      .subscribe();
    return () => {
      clientSupabase.removeChannel(channel);
    };
  }, [chatRoomId, setChatState]);

  useEffect(() => {
    // **채팅방에 있을지 말지
    if (!chatState) {
      // 한 명이 채팅방을 나가서 채팅방 isActive가 false가 되면,
      if (isRest) {
        // 내가 나가기를 누른 사람이 아니라면(남은사람이면) 다시 수락창으로
        router.push(`/meetingRoom/${roomId}`);
      } else {
        // 내가 나가기를 누른 사람이라면 아예 로비로
        router.push('/meetingRoom');
      }
    } else {
      // **채팅방에 있는다면
      console.log('지금 메세지', messages);
      setMessages([...allMsgs].reverse());
      setHasMore(allMsgs?.length >= ITEM_INTERVAL + 1);

      setChatRoomId(chatRoomId);
    }
  }, [chatState, isRest, router]);
  // 왜 요청이 2번이나 되징

  return (
    <>
      {/* <div className="w-full max-w-2xl mx-auto md:py-10 h-screen">
        <div className="h-full border rounded-md flex flex-col border-indigo-600 relative">
          <ChatHeader chatRoomId={chatRoomId} />
          <Suspense fallback="skeleton 들어갈 자리">
            <ChatList user={user} chatRoomId={chatRoomId} />
          </Suspense>
          <ChatInput />
        </div>
      </div> */}
    </>
  );
};

export default InitChat;
