import { Suspense } from 'react';
import { serverSupabase } from '(@/utils/supabase/server)';
import ChatHeader from '(@/components/chat/chatHeader/ChatHeader)';
import ChatList from '(@/components/chat/chatBody/ChatList)';
import InitChat from '(@/components/chat/chatHeader/InitChat)';
import SideBar from '(@/components/chat/sidebar/SideBar)';
import ChatInput from '(@/components/chat/ChatInput)';
import ChatLoading from '(@/components/chat/ChatLoading)';
import { getFromTo } from '(@/utils)';
import { ITEM_INTERVAL } from '(@/utils/constant)';

const ChatPage = async ({ params }: { params: { chatroom_id: string } }) => {
  const chatRoomId = params.chatroom_id;

  const supabase = serverSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const { from, to } = getFromTo(0, ITEM_INTERVAL);
  const { data: allMsgs } = await supabase
    .from('messages')
    .select('*')
    .eq('chatting_room_id', chatRoomId)
    .range(from, to)
    .order('created_at', { ascending: false });
  console.log(allMsgs);

  return (
    <Suspense fallback={<ChatLoading />}>
      <div className="flex felx-row">
        <InitChat chatRoomId={chatRoomId} allMsgs={allMsgs ?? []} />
        <SideBar userId={user?.id} chatRoomId={chatRoomId} />
        <div className="w-full max-w-2xl mx-auto md:py-10 h-screen">
          <div className="h-full border rounded-md flex flex-col border-indigo-600 relative">
            <ChatHeader chatRoomId={chatRoomId} />
            <Suspense fallback="skeleton 들어갈 자리">
              <ChatList user={user} chatRoomId={chatRoomId} />
            </Suspense>
            <ChatInput />
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default ChatPage;
