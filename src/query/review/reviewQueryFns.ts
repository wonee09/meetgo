import { clientSupabase } from '(@/utils/supabase/client)';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DELETE_REVIEW_QUERY_KEY,
  EDIT_IMGS_QUERY_KEY,
  EDIT_REVIEW_QUERY_KEY,
  GET_IMGS_URL_QUERY_KEY,
  NEW_IMGS_QUERY_KEY,
  NEW_REVIEW_QUERY_KEY
} from './reviewQueryKeys';

export const fetchAuthorData = async (review_id: string) => {
  const { data: reviewDetail, error } = await clientSupabase
    .from('review')
    .select('review_title, review_contents, created_at, user_id, image_urls')
    .eq('review_id', review_id)
    .single();

  if (error) {
    console.error('리뷰를 불러오지 못함', error);
  } else {
    if (reviewDetail) {
      const { user_id } = reviewDetail;
      const { data: userData, error: userError } = await clientSupabase
        .from('users')
        .select('nickname, avatar')
        .eq('user_id', user_id as string)
        .single();

      if (userError) {
        console.error('유저 정보를 불러오지 못함', userError);
        return null;
      } else {
        return userData || null;
      }
    }
  }
};

export const fetchReviewData = async (review_id: string) => {
  const { data: reviewDetail, error } = await clientSupabase
    .from('review')
    .select('review_title, review_contents, created_at, user_id, image_urls, show_nickname')
    .eq('review_id', review_id)
    .single();

  if (error) {
    console.error('리뷰를 불러오지 못함', error);
  } else {
    return reviewDetail;
  }
};

export const fetchReviewList = async () => {
  let { data, count } = await clientSupabase.from('review').select('*', { count: 'estimated' });
  return { data, count };
};

export const fetchLikedReviewList = async () => {
  let { data: likedReviewList } = await clientSupabase.from('review_like').select('review_id');
  return likedReviewList;
};

export const useDeleteReviewMutation = () => {
  const queryClient = useQueryClient();
  const deleteCommentMutation = useMutation({
    mutationFn: async (review_id: string) => {
      const { error: commentDeleteError } = await clientSupabase
        .from('review_comment')
        .delete()
        .eq('review_id', review_id);
      const { error: likeDeleteError } = await clientSupabase.from('review_like').delete().eq('review_id', review_id);
      const { error: reviewDeleteError } = await clientSupabase.from('review').delete().eq('review_id', review_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELETE_REVIEW_QUERY_KEY });
    }
  });
  return deleteCommentMutation;
};

export const useNewReviewMutation = () => {
  const queryClient = useQueryClient();
  const newReviewMutation = useMutation({
    mutationFn: async ({
      reviewTitle,
      reviewContents,
      imageUrls,
      userId,
      show_nickname
    }: {
      reviewTitle: string;
      reviewContents: string;
      imageUrls: string[];
      userId: string;
      show_nickname: boolean;
    }) => {
      const { data: newReview, error: newReviewError } = await clientSupabase.from('review').insert([
        {
          review_title: reviewTitle,
          review_contents: reviewContents,
          image_urls: imageUrls,
          user_id: userId,
          show_nickname
        }
      ]);
      if (newReviewError) {
        console.error('insert error', newReviewError);
        return;
      }
      return newReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEW_REVIEW_QUERY_KEY });
    }
  });
  return newReviewMutation;
};

export const useUploadImgsMutation = () => {
  const queryClient = useQueryClient();
  const uploadImgsMutation = useMutation({
    mutationFn: async ({ filePath, file }: { filePath: string; file: File }) => {
      const { data: uploadImgsData, error: uploadImgError } = await clientSupabase.storage
        .from('reviewImage')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadImgError) {
        console.error('insert error', uploadImgError);
        throw uploadImgError;
      }
      const { data: imageUrlData } = await clientSupabase.storage.from('reviewImage').getPublicUrl(uploadImgsData.path);
      // if (getImageUrlError) {
      //   console.error('Error getting image URL', getImageUrlError);
      //   throw getImageUrlError;
      // }

      return imageUrlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NEW_IMGS_QUERY_KEY });
    }
  });
  return uploadImgsMutation;
};

// export const useGetFilePathMutation = () => {
//   const queryClient = useQueryClient();
//   const getFilePathMutation = useMutation({
//     mutationFn: async (uploadImgsData) => {
//       const { data: imageUrl } = clientSupabase.storage.from('reviewImage').getPublicUrl(uploadImgsData.path);

//       return imageUrl.publicUrl;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: GET_IMGS_URL_QUERY_KEY });
//     }
//   });
//   return getFilePathMutation;
// };

export const useEditReviewMutation = () => {
  const queryClient = useQueryClient();
  const editReviewMutation = useMutation({
    mutationFn: async ({
      editedTitle,
      editedContent,
      allImages,
      review_id
    }: {
      editedTitle: string;
      editedContent: string;
      allImages: string[];
      review_id: string;
    }) => {
      const { data: updateReview, error: editReviewError } = await clientSupabase
        .from('review')
        .update({ review_title: editedTitle, review_contents: editedContent, image_urls: allImages })
        .eq('review_id', review_id);
      if (editReviewError) {
        console.error('insert error', editReviewError);
        return;
      }
      return updateReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDIT_REVIEW_QUERY_KEY });
    }
  });
  return editReviewMutation;
};

export const useEditImgsMutation = () => {
  const queryClient = useQueryClient();
  const editImgsMutation = useMutation({
    mutationFn: async ({ filePath, file }: { filePath: string; file: File }) => {
      const { data, error } = await clientSupabase.storage.from('reviewImage').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

      if (error) {
        console.error('업로드 오류', error.message);
        throw error;
      }

      const { data: imageUrl } = await clientSupabase.storage.from('reviewImage').getPublicUrl(data.path);
      return imageUrl.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDIT_IMGS_QUERY_KEY });
    }
  });
  return editImgsMutation;
};

// export const useNewImgsMutation = () => {
//   const queryClient = useQueryClient();

//   const newImgsMutation = useMutation({
//     mutationFn: async (files: File[]) => {
//       const imageUrls: string[] = [];

//       for (const file of files) {
//         const uuid = crypto.randomUUID();
//         const filePath = `reviewImage/${uuid}`;

//         const uploadImage = async (filePath: string, file: File) => {
//           const { data, error } = await clientSupabase.storage.from('reviewImage').upload(filePath, file, {
//             cacheControl: '3600',
//             upsert: true
//           });

//           if (error) {
//             console.error('업로드 오류', error.message);
//             throw error;
//           }

//           return data;
//         };

//         try {
//           const data = await uploadImage(filePath, file);
//           const { data: imageUrl } = await clientSupabase.storage.from('reviewImage').getPublicUrl(data.path);
//           imageUrls.push(imageUrl.publicUrl);
//         } catch (error) {
//           console.error('이미지 업로드 오류:', error);
//           throw error;
//         }
//       }

//       return imageUrls;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: NEW_IMAGES_UPLOAD_QUERY_KEY });
//     }
//   });

//   return newImgsMutation;
// };
