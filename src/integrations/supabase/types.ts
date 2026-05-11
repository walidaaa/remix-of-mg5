export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      car_brands: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      car_models: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "car_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance: {
        Row: {
          compagnie: string
          cout: number | null
          date_debut: string | null
          date_fin: string | null
          numero_police: string
          scan_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          compagnie?: string
          cout?: number | null
          date_debut?: string | null
          date_fin?: string | null
          numero_police?: string
          scan_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          compagnie?: string
          cout?: number | null
          date_debut?: string | null
          date_fin?: string | null
          numero_police?: string
          scan_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      maintenance_items: {
        Row: {
          cout: number | null
          created_at: string
          date: string
          id: string
          intervalle_km: number | null
          intervalle_mois: number | null
          km: number
          notes: string | null
          type: string
          user_id: string
        }
        Insert: {
          cout?: number | null
          created_at?: string
          date: string
          id?: string
          intervalle_km?: number | null
          intervalle_mois?: number | null
          km: number
          notes?: string | null
          type: string
          user_id: string
        }
        Update: {
          cout?: number | null
          created_at?: string
          date?: string
          id?: string
          intervalle_km?: number | null
          intervalle_mois?: number | null
          km?: number
          notes?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      oil_changes: {
        Row: {
          cout: number | null
          created_at: string
          date: string
          filtre_huile: string | null
          id: string
          km: number
          notes: string | null
          type_huile: string
          user_id: string
        }
        Insert: {
          cout?: number | null
          created_at?: string
          date: string
          filtre_huile?: string | null
          id?: string
          km: number
          notes?: string | null
          type_huile: string
          user_id: string
        }
        Update: {
          cout?: number | null
          created_at?: string
          date?: string
          filtre_huile?: string | null
          id?: string
          km?: number
          notes?: string | null
          type_huile?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          blocked: boolean
          created_at: string
          display_name: string | null
          id: string
          username: string | null
        }
        Insert: {
          blocked?: boolean
          created_at?: string
          display_name?: string | null
          id: string
          username?: string | null
        }
        Update: {
          blocked?: boolean
          created_at?: string
          display_name?: string | null
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      scans: {
        Row: {
          id: string
          scanned_at: string
          user_id: string
          value: string
        }
        Insert: {
          id?: string
          scanned_at?: string
          user_id: string
          value: string
        }
        Update: {
          id?: string
          scanned_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_doc: {
        Row: {
          cout: number | null
          date_debut: string | null
          date_fin: string | null
          numero: string
          organisme: string
          scan_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cout?: number | null
          date_debut?: string | null
          date_fin?: string | null
          numero?: string
          organisme?: string
          scan_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cout?: number | null
          date_debut?: string | null
          date_fin?: string | null
          numero?: string
          organisme?: string
          scan_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          annee: number
          couleur: string
          created_at: string
          intervalle_vidange: number
          km_actuel: number
          marque: string
          matricule: string
          modele: string
          transmission: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annee?: number
          couleur?: string
          created_at?: string
          intervalle_vidange?: number
          km_actuel?: number
          marque?: string
          matricule?: string
          modele?: string
          transmission?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annee?: number
          couleur?: string
          created_at?: string
          intervalle_vidange?: number
          km_actuel?: number
          marque?: string
          matricule?: string
          modele?: string
          transmission?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vignette: {
        Row: {
          compagnie: string
          cout: number | null
          date_debut: string | null
          date_fin: string | null
          numero: string
          scan_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          compagnie?: string
          cout?: number | null
          date_debut?: string | null
          date_fin?: string | null
          numero?: string
          scan_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          compagnie?: string
          cout?: number | null
          date_debut?: string | null
          date_fin?: string | null
          numero?: string
          scan_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
