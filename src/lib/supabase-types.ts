/**
 * FreightVeil — Supabase Database Types
 *
 * Manually maintained to match supabase/migrations/*.sql exactly.
 * Run `supabase gen types typescript --local` to auto-regenerate once you
 * have the Supabase CLI installed and the local stack running.
 *
 * PRIVACY NOTE: No financial fields (rate, distance, budget, cost, payouts)
 * appear here — those never enter the database.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BatchStatus = "locked" | "settled" | "disputed";
export type WalletRole = "shipper" | "carrier";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          wallet_address: string;
          role: WalletRole;
          display_name: string | null;
          on_chain_tx: string | null;
          created_at: string;
        };
        Insert: {
          wallet_address: string;
          role: WalletRole;
          display_name?: string | null;
          on_chain_tx?: string | null;
          created_at?: string;
        };
        Update: {
          wallet_address?: string;
          role?: WalletRole;
          display_name?: string | null;
          on_chain_tx?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      batches_view: {
        Row: {
          batch_id: string;
          status: BatchStatus;
          shipper_wallet: string | null;
          carrier_wallet: string | null;
          tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          batch_id: string;
          status: BatchStatus;
          shipper_wallet?: string | null;
          carrier_wallet?: string | null;
          tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          batch_id?: string;
          status?: BatchStatus;
          shipper_wallet?: string | null;
          carrier_wallet?: string | null;
          tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "batches_view_shipper_wallet_fkey";
            columns: ["shipper_wallet"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["wallet_address"];
          },
          {
            foreignKeyName: "batches_view_carrier_wallet_fkey";
            columns: ["carrier_wallet"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["wallet_address"];
          },
        ];
      };

      notifications: {
        Row: {
          id: string;
          wallet_address: string | null;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_address?: string | null;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string | null;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_wallet_address_fkey";
            columns: ["wallet_address"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["wallet_address"];
          },
        ];
      };
    };

    Views: {
      batches_public: {
        Row: {
          batch_id: string;
          status: BatchStatus;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
      };
    };

    Functions: {
      auth_wallet: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
    };

    Enums: Record<PropertyKey, never>;

    CompositeTypes: Record<PropertyKey, never>;
  };
}
