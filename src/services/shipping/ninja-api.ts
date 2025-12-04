/**
 * Ninja (MoovParcel) API Integration
 * Used for warehouse fulfillment orders
 */

export interface NinjaCredentials {
  email: string;
  password: string;
}

export interface NinjaLoginResponse {
  accessToken: string;
  [key: string]: unknown;
}

export interface NinjaOrderData {
  order_id: string;
  channel_id?: string;
  channel_alt_id?: string;
  channel_name: string;
  channel_type: string;
  store_id?: string;
  remote_id: string;
  remote_status?: string;
  status?: string;
  customer: {
    id?: string | null;
    customer_uuid?: string | null;
    company_id?: string | null;
    name: string;
    email: string;
    created_at: string;
    updated_at?: string;
  };
  shipping_method: string;
  shipping_address: {
    id?: string;
    name: string;
    company_name?: string | null;
    address_line_one: string;
    address_line_two?: string;
    address_line_three?: string;
    county?: string;
    city: string;
    country_iso_code: string;
    zip: string;
    phone?: string;
  };
  invoice_address: {
    id?: string;
    name: string;
    company_name?: string | null;
    address_line_one: string;
    address_line_two?: string;
    address_line_three?: string;
    county?: string;
    city: string;
    country_iso_code: string;
    zip: string;
    phone?: string;
  };
  fulfillment?: unknown;
  return?: unknown;
  payment_method: string;
  send_via_webhook: boolean;
  payment_details: {
    vat_id?: string | null;
    vat_type?: string | null;
    tax_total: string;
    shipping_total: string;
    discount_total: string;
    discount_total_exc_tax: string;
    order_subtotal: string;
    order_subtotal_exc_tax: string;
    order_total: string;
    payment_method: string;
    payment_ref?: string | null;
    payment_currency: string;
    coupon_code?: string;
    coupon_total: string;
    coupon_total_exc_tax: string;
  };
  system_notes?: string | null;
  delivery_notes?: string | null;
  customer_comments?: string | null;
  gift_note?: string;
  channel_specific: {
    tags: string[];
    order_number: string;
    total_weight: number;
    shipping_code?: string;
  };
  order_date: string;
  order_import_date?: string;
  md5_hash?: string;
  total_order_item_quantity: number;
  total_order_item_quantity_inc_kits?: number | null;
  primary_reference_id: string;
  order_lines: Array<{
    sku: string;
    quantity: number;
    name: string;
    unit_price: number;
    total_price: number;
  }>;
  order_access_url?: string;
}

export interface NinjaImportResponse {
  success: boolean;
  order_id?: string;
  message?: string;
  [key: string]: unknown;
}

export interface NinjaOrderResponse {
  order_id: string;
  status: string;
  tracking_number?: string;
  [key: string]: unknown;
}

export class NinjaApiClient {
  private baseUrl = 'https://api.moovparcel.net/api';
  private credentials: NinjaCredentials;
  private accessToken: string | null = null;

  constructor(credentials: NinjaCredentials) {
    this.credentials = credentials;
  }

  /**
   * Authenticate with Ninja API
   */
  async authenticate(): Promise<string> {
    const endpoint = `${this.baseUrl}/login`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VintStreet/1.0',
        Accept: 'application/json',
        Authorization: new Date().getTime().toString(),
      },
      body: JSON.stringify({
        email: this.credentials.email,
        password: this.credentials.password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ninja API authentication failed: ${response.status} - ${errorText}`);
    }

    const data: NinjaLoginResponse = await response.json();

    if (!data.accessToken) {
      throw new Error('Ninja API response missing access token');
    }

    this.accessToken = data.accessToken;
    return data.accessToken;
  }

  /**
   * Import order to Ninja
   */
<<<<<<< HEAD
  async importOrder(orderData: NinjaOrderData[]): Promise<unknown> {
=======
  async importOrder(orderData: NinjaOrderData[]): Promise<NinjaImportResponse> {
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
    if (!this.accessToken) {
      await this.authenticate();
    }

    const endpoint = `${this.baseUrl}/orders/import-json`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ninja API order import failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get order details
   */
<<<<<<< HEAD
  async getOrder(orderId: string): Promise<unknown> {
=======
  async getOrder(orderId: string): Promise<NinjaOrderResponse> {
>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
    if (!this.accessToken) {
      await this.authenticate();
    }

    const endpoint = `${this.baseUrl}/orders/${orderId}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ninja API get order failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }
}
