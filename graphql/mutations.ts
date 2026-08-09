import { gql } from '@apollo/client';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const GOOGLE_LOGIN = gql`
  mutation GoogleLogin($input: GoogleLoginInput!) {
    googleLogin(input: $input) {
      accessToken
      refreshToken
      user { id name email avatarUrl permission phone verified }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

// ─── Push notifications ──────────────────────────────────────────────────────

export const REGISTER_PUSH_TOKEN = gql`
  mutation RegisterPushToken($token: String!, $platform: String) {
    registerPushToken(token: $token, platform: $platform)
  }
`;

export const REMOVE_PUSH_TOKEN = gql`
  mutation RemovePushToken($token: String!) {
    removePushToken(token: $token)
  }
`;

// ─── User ────────────────────────────────────────────────────────────────────

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id name email phone avatarUrl coverUrl bio location
      language notifMessages notifOffers notifMarketing
      showEmail showPhone themePreference
      updatedAt
    }
  }
`;

// ─── Products ────────────────────────────────────────────────────────────────

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id title price status createdAt
      images { id url sortOrder }
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id title description price discount condition city status
      images { id url sortOrder }
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id) { id }
  }
`;

export const VIEW_PRODUCT = gql`
  mutation ViewProduct($id: String!, $viewerKey: String) {
    viewProduct(id: $id, viewerKey: $viewerKey) { id views }
  }
`;

export const CONTACT_PRODUCT = gql`
  mutation ContactProduct($id: String!) {
    contactProduct(id: $id) { id contacts }
  }
`;

export const CREATE_SAVED_SEARCH = gql`
  mutation CreateSavedSearch($input: CreateSavedSearchInput!) {
    createSavedSearch(input: $input) { id }
  }
`;

export const DELETE_SAVED_SEARCH = gql`
  mutation DeleteSavedSearch($id: String!) {
    deleteSavedSearch(id: $id) { id }
  }
`;

export const DELETE_MY_ACCOUNT = gql`
  mutation DeleteMyAccount {
    deleteMyAccount { id }
  }
`;

// ─── Favorites ───────────────────────────────────────────────────────────────

export const TOGGLE_FAVORITE = gql`
  mutation ToggleFavorite($productId: String!) {
    toggleFavorite(productId: $productId) { added }
  }
`;

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const CREATE_REVIEW = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id rating text createdAt
      author { id name avatarUrl }
    }
  }
`;

export const UPDATE_REVIEW = gql`
  mutation UpdateReview($id: String!, $input: UpdateReviewInput!) {
    updateReview(id: $id, input: $input) {
      id rating text createdAt
      author { id name avatarUrl }
    }
  }
`;

export const DELETE_REVIEW = gql`
  mutation DeleteReview($id: String!) {
    deleteReview(id: $id) { id }
  }
`;

// ─── Followers ───────────────────────────────────────────────────────────────

export const FOLLOW_USER = gql`
  mutation FollowUser($userId: String!) {
    followUser(userId: $userId) {
      id
      follower { id name }
      followed { id name }
    }
  }
`;

export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: String!) {
    unfollowUser(userId: $userId) { id }
  }
`;

// ─── Reports ─────────────────────────────────────────────────────────────────

export const CREATE_REPORT = gql`
  mutation CreateReport($input: CreateReportInput!) {
    createReport(input: $input) { id status }
  }
`;

// ─── Notifications ───────────────────────────────────────────────────────────

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: String!) {
    markNotificationRead(id: $id) { id read }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: String!) {
    deleteNotification(id: $id) { id }
  }
`;

export const DELETE_ALL_NOTIFICATIONS = gql`
  mutation DeleteAllNotifications {
    deleteAllNotifications
  }
`;

// ─── OTP ────────────────────────────────────────────────────────────────────

export const SEND_PHONE_OTP = gql`
  mutation SendPhoneOtp($input: SendPhoneOtpInput!) {
    sendPhoneOtp(input: $input) {
      success
      message
    }
  }
`;

export const VERIFY_PHONE_OTP = gql`
  mutation VerifyPhoneOtp($input: VerifyPhoneOtpInput!) {
    verifyPhoneOtp(input: $input) {
      success
      message
    }
  }
`;

// ─── Home sections ──────────────────────────────────────────────────────────

export const TRACK_HOME_SECTION_EVENT = gql`
  mutation TrackHomeSectionEvent($sectionId: String!, $event: String!, $viewerKey: String!) {
    trackHomeSectionEvent(sectionId: $sectionId, event: $event, viewerKey: $viewerKey)
  }
`;

// ─── Verifications ───────────────────────────────────────────────────────────

export const REQUEST_VERIFICATION = gql`
  mutation RequestVerification($input: RequestVerificationInput) {
    requestVerification(input: $input) {
      id
      status
      docs
      createdAt
    }
  }
`;

// ─── Plans v2 — pinned & auto-bump slots ────────────────────────────────────

export const SET_PINNED_PRODUCTS = gql`
  mutation SetPinnedProducts($productIds: [String!]!) {
    setPinnedProducts(productIds: $productIds) {
      id
      title
      price
      images { id url sortOrder type thumbnailUrl }
      priceReducedUntil
    }
  }
`;

export const SET_AUTO_BUMP_SLOTS = gql`
  mutation SetAutoBumpSlots($productIds: [String!]!) {
    setAutoBumpSlots(productIds: $productIds) {
      id
      productId
      cadence
      createdAt
      product {
        id
        title
        images { id url sortOrder type thumbnailUrl }
      }
    }
  }
`;

