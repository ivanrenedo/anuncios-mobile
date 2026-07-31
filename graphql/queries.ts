import { gql } from '@apollo/client';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const ME = gql`
  query Me {
    me {
      id
      name
      email
      phone
      avatarUrl
      coverUrl
      bio
      location
      verified
      permission
      suspended
      suspendedReason
      language
      plan
      planExpiresAt
      effectivePlan
      maxActiveProducts
      maxImagesPerProduct
      notifMessages
      notifOffers
      notifMarketing
      showEmail
      showPhone
      themePreference
      createdAt
      updatedAt
    }
  }
`;

// ─── Products ────────────────────────────────────────────────────────────────

export const GET_PRODUCTS = gql`
  query Products($take: Int, $skip: Int) {
    products(take: $take, skip: $skip) {
      id
      title
      description
      price
      discount
      condition
      city
      status
      views
      favoritesCount
      bumpedAt
      boostedUntil
      createdAt
      seller {
        id
        name
        avatarUrl
        verified
        plan
        effectivePlan
        location
      }
      category {
        id
        slug
        label
        color
      }
      images {
        id
        url
        sortOrder
        type
        thumbnailUrl
      }
      attributes {
        id
        label
        value
      }
      marketplaceDetail {
        brand
        model
        colors
      }
      vehicleDetail {
        id
        operation
        brand
        model
        year
        kilometrage
        transmission
        engine
        colors
      }
      propertyDetail {
        id
        operation
        bedrooms
        bathrooms
        floor
        surface
        address
      }
      serviceDetail {
        id
        offerType
      }
      jobDetail {
        id
        link
      }
    }
  }
`;

export const GET_PRODUCT = gql`
  query Product($id: String!) {
    product(id: $id) {
      id
      title
      description
      price
      discount
      condition
      city
      status
      views
      favoritesCount
      bumpedAt
      boostedUntil
      createdAt
      seller {
        id
        name
        avatarUrl
        verified
        plan
        effectivePlan
        location
        bio
        phone
        showPhone
      }
      category {
        id
        slug
        label
        color
        parentId
      }
      images {
        id
        url
        sortOrder
        type
        thumbnailUrl
      }
      attributes {
        id
        label
        value
      }
      marketplaceDetail {
        brand
        model
        colors
      }
      vehicleDetail {
        id
        operation
        brand
        model
        year
        kilometrage
        transmission
        engine
        colors
      }
      propertyDetail {
        id
        operation
        bedrooms
        bathrooms
        floor
        surface
        address
      }
      serviceDetail {
        id
        offerType
      }
      jobDetail {
        id
        link
      }
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($input: SearchProductsInput!) {
    searchProducts(input: $input) {
      id
      title
      description
      price
      discount
      condition
      city
      status
      views
      favoritesCount
      bumpedAt
      boostedUntil
      createdAt
      seller {
        id
        name
        avatarUrl
        verified
        plan
        effectivePlan
        location
      }
      category {
        id
        slug
        label
        color
      }
      images {
        id
        url
        sortOrder
        type
        thumbnailUrl
      }
      propertyDetail {
        operation
      }
      serviceDetail {
        offerType
      }
      vehicleDetail {
        operation
        brand
        model
        engine
        transmission
        colors
      }
    }
  }
`;

export const PRODUCTS_BY_CATEGORY = gql`
  query ProductsByCategory($categoryId: String!, $take: Int, $skip: Int) {
    productsByCategory(categoryId: $categoryId, take: $take, skip: $skip) {
      id
      title
      price
      discount
      condition
      city
      views
      favoritesCount
      bumpedAt
      boostedUntil
      createdAt
      seller {
        id
        name
        avatarUrl
        verified
        plan
        effectivePlan
      }
      category {
        id
        slug
        label
        color
      }
      images {
        id
        url
        sortOrder
        type
        thumbnailUrl
      }
    }
  }
`;

export const MY_SAVED_SEARCHES = gql`
  query MySavedSearches {
    mySavedSearches {
      id
      query
      categoryId
      city
      priceMin
      priceMax
      createdAt
    }
  }
`;

export const MY_VIEWS_DAILY = gql`
  query MyViewsDaily($days: Int) {
    myViewsDaily(days: $days) {
      date
      count
    }
  }
`;

export const PRODUCTS_BY_SELLER = gql`
  query ProductsBySeller($sellerId: String!) {
    productsBySeller(sellerId: $sellerId) {
      id
      title
      price
      discount
      condition
      city
      status
      views
      favoritesCount
      contacts
      impressions
      bumpedAt
      boostedUntil
      createdAt
      category {
        id
        slug
        label
        color
      }
      images {
        id
        url
        sortOrder
        type
        thumbnailUrl
      }
      vehicleDetail {
        operation
      }
      propertyDetail {
        operation
      }
      serviceDetail {
        offerType
      }
    }
  }
`;

// ─── Classifications & Categories ────────────────────────────────────────────

export const CATEGORY_TREE = gql`
  query CategoryTree {
    categoryTree {
      id
      slug
      label
      color
      icon
      sortOrder
      children {
        id
        slug
        label
        color
        icon
        sortOrder
        children {
          id
          slug
          label
          sortOrder
        }
      }
    }
  }
`;

// ─── Favorites ───────────────────────────────────────────────────────────────

export const MY_FAVORITES = gql`
  query MyFavorites {
    myFavorites {
      id
      createdAt
      product {
        id
        title
        price
        discount
        condition
        city
        views
        favoritesCount
        bumpedAt
        boostedUntil
        createdAt
        seller {
          id
          name
          avatarUrl
          verified
          plan
          effectivePlan
        }
        category {
          id
          slug
          label
          color
        }
        images {
          id
          url
          sortOrder
        type
        thumbnailUrl
        }
        vehicleDetail {
          operation
        }
        propertyDetail {
          operation
        }
        serviceDetail {
          offerType
        }
      }
    }
  }
`;

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const REVIEWS_BY_SELLER = gql`
  query ReviewsBySeller($sellerId: String!) {
    reviewsBySeller(sellerId: $sellerId) {
      id
      rating
      text
      createdAt
      author {
        id
        name
        avatarUrl
      }
    }
  }
`;

export const SELLER_RATING = gql`
  query SellerRating($sellerId: String!) {
    sellerRating(sellerId: $sellerId) {
      average
      count
    }
  }
`;

// ─── Followers ───────────────────────────────────────────────────────────────

export const GET_FOLLOWERS = gql`
  query Followers($userId: String!) {
    followers(userId: $userId) {
      id
      createdAt
      follower {
        id
        name
        avatarUrl
        verified
        location
        plan
        effectivePlan
      }
    }
  }
`;

export const GET_FOLLOWING = gql`
  query Following($userId: String!) {
    following(userId: $userId) {
      id
      createdAt
      followed {
        id
        name
        avatarUrl
        verified
        location
        plan
        effectivePlan
      }
    }
  }
`;

export const IS_FOLLOWING = gql`
  query IsFollowing($userId: String!) {
    isFollowing(userId: $userId)
  }
`;

export const FOLLOWERS_COUNT = gql`
  query FollowersCount($userId: String!) {
    followersCount(userId: $userId)
  }
`;

export const FOLLOWING_COUNT = gql`
  query FollowingCount($userId: String!) {
    followingCount(userId: $userId)
  }
`;

// ─── Notifications ───────────────────────────────────────────────────────────

export const GET_NOTIFICATIONS = gql`
  query Notifications {
    notifications {
      id
      type
      title
      body
      read
      avatar
      relatedProductId
      relatedUserId
      sectionId
      filterCat
      createdAt
    }
  }
`;

export const UNREAD_COUNT = gql`
  query UnreadNotificationsCount {
    unreadNotificationsCount
  }
`;

// ─── Home sections ──────────────────────────────────────────────────────────

export const GET_HOME_SECTIONS = gql`
  query HomeSections($viewerKey: String) {
    homeSections(viewerKey: $viewerKey) {
      id
      type
      title
      subtitle
      icon
      filter
      config
      sortOrder
      products {
        id
        title
        description
        price
        discount
        condition
        city
        views
        favoritesCount
        bumpedAt
        boostedUntil
        createdAt
        seller {
          id
          name
          avatarUrl
          verified
          plan
          effectivePlan
        }
        category {
          id
          slug
          label
          color
        }
        images {
          id
          url
          sortOrder
        type
        thumbnailUrl
        }
        vehicleDetail {
          operation
        }
        propertyDetail {
          operation
        }
        serviceDetail {
          offerType
        }
      }
    }
  }
`;

export const GET_FILTERABLE_SECTIONS = gql`
  query FilterableSections {
    filterableSections {
      id
      type
      title
      icon
      filter
    }
  }
`;

export const GET_SECTION_PRODUCTS = gql`
  query SectionProducts($sectionId: String!, $take: Int, $skip: Int) {
    sectionProducts(sectionId: $sectionId, take: $take, skip: $skip) {
      id
      title
      description
      price
      discount
      condition
      city
      views
      favoritesCount
      bumpedAt
      boostedUntil
      createdAt
      seller {
        id
        name
        avatarUrl
        verified
        plan
        effectivePlan
      }
      category {
        id
        slug
        label
        color
      }
      images {
        id
        url
        sortOrder
        type
        thumbnailUrl
      }
      vehicleDetail {
        operation
      }
      propertyDetail {
        operation
      }
      serviceDetail {
        offerType
      }
    }
  }
`;

// ─── User ────────────────────────────────────────────────────────────────────

export const GET_USER = gql`
  query User($id: String!) {
    user(id: $id) {
      id
      name
      email
      phone
      avatarUrl
      coverUrl
      bio
      location
      verified
      plan
      planExpiresAt
      effectivePlan
      language
      showEmail
      showPhone
      createdAt
    }
  }
`;

export const BUSINESS_CONTACT = gql`
  query BusinessContact {
    businessContact {
      phone
      email
    }
  }
`;

// ─── Verifications ───────────────────────────────────────────────────────────

export const MY_VERIFICATION_REQUEST = gql`
  query MyVerificationRequest {
    myVerificationRequest {
      id
      status
      rejectedReason
      reviewedAt
      createdAt
    }
  }
`;
