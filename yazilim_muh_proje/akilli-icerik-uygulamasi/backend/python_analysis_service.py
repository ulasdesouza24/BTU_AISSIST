#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import pandas as pd
import numpy as np
import os
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Ana proje klasörüne path ekle
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))
sys.path.append(project_root)

try:
    from data_loader import DataLoader
    from predictive_analyzer import PredictiveAnalyzer
    from visualization_generator import VisualizationGenerator
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Import hatası: {str(e)}. Lütfen ana klasörde data_loader.py dosyasının olduğundan emin olun."}))
    sys.exit(1)

class PythonAnalysisService:
    def __init__(self):
        try:
            self.loader = DataLoader()
            self.predictor = PredictiveAnalyzer()
            self.visualizer = VisualizationGenerator()
        except Exception as e:
            raise Exception(f"Servis başlatma hatası: {str(e)}")
    
    def analyze_file(self, file_path, file_type='auto'):
        """Dosyayı analiz et ve JSON sonucu döndür"""
        try:
            # Dosya yolunu mutlak yola çevir
            if not os.path.isabs(file_path):
                file_path = os.path.abspath(file_path)
            
            if not os.path.exists(file_path):
                return {"success": False, "error": f"Dosya bulunamadı: {file_path}"}
            
            results = {
                "success": True,
                "timestamp": datetime.now().isoformat(),
                "file_info": {
                    "path": file_path,
                    "type": file_type
                },
                "analysis": {},
                "statistics": {},
                "insights": {},
                "visualizations": {},
                "predictions": {}
            }
            
            # 1. Veri yükleme
            data = self.loader.load_data(file_path)
            if data is None:
                return {"success": False, "error": "Dosya yüklenemedi"}
            
            results["file_info"]["rows"] = len(data)
            results["file_info"]["columns"] = len(data.columns)
            results["file_info"]["column_names"] = data.columns.tolist()
            
            # 2. Veri temizleme
            cleaned_data = self.loader.clean_data()
            
            # 3. Veri keşfi ve profiling
            data_profile = self.loader.explore_data()
            results["analysis"] = data_profile
            
            # 4. Temel istatistikler
            stats = self._generate_comprehensive_statistics(cleaned_data)
            results["statistics"] = stats
            
            # 5. İş insights'ları
            insights = self._generate_business_insights(cleaned_data, data_profile)
            results["insights"] = insights
            
            # 6. Görselleştirme önerileri
            viz_recommendations = self._generate_visualization_recommendations(cleaned_data)
            results["visualizations"] = viz_recommendations
            
            # 7. Tahminsel analiz
            if len(cleaned_data) > 10:
                predictions = self._run_predictive_analysis(cleaned_data)
                results["predictions"] = predictions
            
            return results
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _generate_comprehensive_statistics(self, data):
        """Kapsamlı istatistiksel analiz"""
        stats = {
            "basic": {},
            "numeric": {},
            "categorical": {},
            "correlations": {},
            "data_quality": {},
            "distributions": {}
        }
        
        # Temel bilgiler
        stats["basic"] = {
            "shape": data.shape,
            "memory_usage": int(data.memory_usage(deep=True).sum()),
            "dtypes": data.dtypes.astype(str).to_dict(),
            "null_counts": data.isnull().sum().to_dict(),
            "null_percentages": (data.isnull().sum() / len(data) * 100).to_dict()
        }
        
        # Sayısal kolonlar analizi
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            stats["numeric"] = {
                "descriptive": data[numeric_cols].describe().to_dict(),
                "skewness": data[numeric_cols].skew().to_dict(),
                "kurtosis": data[numeric_cols].kurtosis().to_dict()
            }
            
            # Korelasyon matrisi
            if len(numeric_cols) > 1:
                corr_matrix = data[numeric_cols].corr()
                stats["correlations"] = {
                    "matrix": corr_matrix.to_dict(),
                    "strong_correlations": self._find_strong_correlations(corr_matrix)
                }
        
        # Kategorik kolonlar analizi
        categorical_cols = data.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            cat_stats = {}
            for col in categorical_cols:
                value_counts = data[col].value_counts()
                cat_stats[col] = {
                    "unique_count": int(data[col].nunique()),
                    "most_frequent": value_counts.head(5).to_dict(),
                    "frequency_distribution": value_counts.head(10).to_dict()
                }
            stats["categorical"] = cat_stats
        
        # Veri kalitesi analizi
        stats["data_quality"] = {
            "completeness_score": float((1 - data.isnull().sum().sum() / (len(data) * len(data.columns))) * 100),
            "duplicate_rows": int(data.duplicated().sum()),
            "columns_with_missing_data": data.columns[data.isnull().any()].tolist(),
            "high_cardinality_columns": [col for col in categorical_cols if data[col].nunique() > len(data) * 0.9]
        }
        
        return stats
    
    def _find_strong_correlations(self, corr_matrix, threshold=0.7):
        """Güçlü korelasyonları bul"""
        strong_corrs = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_val = corr_matrix.iloc[i, j]
                if abs(corr_val) > threshold:
                    strong_corrs.append({
                        "var1": corr_matrix.columns[i],
                        "var2": corr_matrix.columns[j],
                        "correlation": float(corr_val),
                        "strength": "very_strong" if abs(corr_val) > 0.9 else "strong"
                    })
        return strong_corrs
    
    def _generate_business_insights(self, data, data_profile):
        """İş odaklı insights üret"""
        insights = {
            "data_type_assessment": "",
            "key_findings": [],
            "performance_indicators": {},
            "risk_factors": [],
            "opportunities": [],
            "recommendations": []
        }
        
        # Veri türü değerlendirmesi
        domain = data_profile.get("business_domain", {}).get("primary", "unknown")
        insights["data_type_assessment"] = self._assess_data_domain(data, domain)
        
        # Temel bulgular
        insights["key_findings"] = self._extract_key_findings(data)
        
        # Performans göstergeleri
        insights["performance_indicators"] = self._calculate_kpis(data)
        
        # Risk faktörleri
        insights["risk_factors"] = self._identify_risks(data)
        
        # Fırsatlar
        insights["opportunities"] = self._identify_opportunities(data)
        
        # Öneriler
        insights["recommendations"] = self._generate_recommendations(data)
        
        return insights
    
    def _assess_data_domain(self, data, domain):
        """Veri alanını değerlendir"""
        assessments = {
            "retail": "Bu veri perakende/satış alanına ait görünüyor. Ürün satışları, müşteri davranışları ve gelir analizine odaklanılmalı.",
            "finance": "Bu finansal veri seti, işlem analizleri, risk değerlendirmesi ve karlılık analizi için uygundur.",
            "healthcare": "Sağlık verisi olarak hasta akışları, tedavi etkinliği ve kaynak kullanımı analizine uygun.",
            "hr": "İnsan kaynakları verisi, personel performansı ve organizasyonel analiz için kullanılabilir.",
            "unknown": "Veri türü belirsiz, genel analiz yaklaşımı uygulanacak."
        }
        return assessments.get(domain, assessments["unknown"])
    
    def _extract_key_findings(self, data):
        """Anahtar bulguları çıkar"""
        findings = []
        
        # En yüksek/düşük değerler
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        for col in numeric_cols[:3]:  # İlk 3 sayısal kolon
            max_val = data[col].max()
            min_val = data[col].min()
            findings.append(f"{col} değişkeninde en yüksek değer {max_val:.2f}, en düşük değer {min_val:.2f}")
        
        # Eksik veri oranları
        missing_data = data.isnull().sum()
        high_missing = missing_data[missing_data > len(data) * 0.1]
        if len(high_missing) > 0:
            findings.append(f"Yüksek eksik veri oranına sahip kolonlar: {', '.join(high_missing.index)}")
        
        return findings
    
    def _calculate_kpis(self, data):
        """KPI'ları hesapla"""
        kpis = {}
        
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) > 0:
            # Genel performans metrikleri
            for col in numeric_cols[:5]:  # İlk 5 sayısal kolon
                kpis[f"{col}_average"] = float(data[col].mean())
                kpis[f"{col}_median"] = float(data[col].median())
                kpis[f"{col}_std"] = float(data[col].std())
                kpis[f"{col}_cv"] = float(data[col].std() / data[col].mean()) if data[col].mean() != 0 else 0
        
        return kpis
    
    def _identify_risks(self, data):
        """Risk faktörlerini belirle"""
        risks = []
        
        # Yüksek varyasyon riski
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            cv = data[col].std() / data[col].mean() if data[col].mean() != 0 else 0
            if cv > 1:
                risks.append(f"{col} değişkeninde yüksek varyasyon riski (CV: {cv:.2f})")
        
        # Eksik veri riski
        missing_ratio = data.isnull().sum() / len(data)
        high_missing = missing_ratio[missing_ratio > 0.2]
        if len(high_missing) > 0:
            risks.append(f"Yüksek eksik veri riski bulunan kolonlar: {', '.join(high_missing.index)}")
        
        return risks
    
    def _identify_opportunities(self, data):
        """Fırsatları belirle"""
        opportunities = []
        
        # Segmentasyon fırsatları
        categorical_cols = data.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            unique_count = data[col].nunique()
            if 2 <= unique_count <= 10:
                opportunities.append(f"{col} bazında segmentasyon analizi yapılabilir ({unique_count} segment)")
        
        # Korelasyon fırsatları
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 1:
            corr_matrix = data[numeric_cols].corr()
            strong_corrs = []
            for i in range(len(corr_matrix.columns)):
                for j in range(i+1, len(corr_matrix.columns)):
                    if abs(corr_matrix.iloc[i, j]) > 0.7:
                        strong_corrs.append((corr_matrix.columns[i], corr_matrix.columns[j]))
            
            if strong_corrs:
                opportunities.append(f"Güçlü korelasyonlar bulundu: {len(strong_corrs)} çift")
        
        return opportunities
    
    def _generate_recommendations(self, data):
        """Önerileri oluştur"""
        recommendations = []
        
        # Veri kalitesi önerileri
        missing_data = data.isnull().sum()
        if missing_data.sum() > 0:
            recommendations.append("Eksik verilerin doldurulması veya silinmesi için strateji geliştirilmeli")
        
        # Analiz önerileri
        numeric_cols = len(data.select_dtypes(include=[np.number]).columns)
        categorical_cols = len(data.select_dtypes(include=['object']).columns)
        
        if numeric_cols > 0:
            recommendations.append("Sayısal değişkenler için trend analizi ve tahminleme modelleri oluşturulmalı")
        
        if categorical_cols > 0:
            recommendations.append("Kategorik değişkenler için segmentasyon ve kümeleme analizleri yapılmalı")
        
        return recommendations
    
    def _generate_visualization_recommendations(self, data):
        """Görselleştirme önerileri"""
        viz_recs = {
            "recommended_charts": [],
            "chart_data": {}
        }
        
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        categorical_cols = data.select_dtypes(include=['object']).columns
        
        # Sayısal kolonlar için histogram önerisi
        if len(numeric_cols) > 0:
            for col in numeric_cols[:3]:
                viz_recs["recommended_charts"].append({
                    "type": "histogram",
                    "title": f"{col} Dağılımı",
                    "description": f"{col} değişkeninin frekans dağılımı",
                    "column": col
                })
        
        # Kategorik kolonlar için bar chart önerisi
        if len(categorical_cols) > 0:
            for col in categorical_cols[:2]:
                viz_recs["recommended_charts"].append({
                    "type": "bar",
                    "title": f"{col} Dağılımı",
                    "description": f"{col} kategorilerinin frekans analizi",
                    "column": col
                })
        
        # Korelasyon matrisi önerisi
        if len(numeric_cols) > 1:
            viz_recs["recommended_charts"].append({
                "type": "heatmap",
                "title": "Korelasyon Matrisi",
                "description": "Sayısal değişkenler arası ilişkiler",
                "columns": numeric_cols.tolist()
            })
        
        return viz_recs
    
    def _run_predictive_analysis(self, data):
        """Tahminsel analiz yap"""
        try:
            numeric_cols = data.select_dtypes(include=[np.number]).columns
            
            if len(numeric_cols) < 2:
                return {"message": "Tahminsel analiz için yeterli sayısal veri yok"}
            
            # Basit korelasyon analizi
            target_col = numeric_cols[0]
            feature_cols = numeric_cols[1:4]
            
            # Temiz veri hazırla
            clean_data = data[list(feature_cols) + [target_col]].dropna()
            
            if len(clean_data) < 10:
                return {"message": "Tahminsel analiz için yeterli temiz veri yok"}
            
            # Basit istatistiksel analiz
            correlations = {}
            for feature in feature_cols:
                corr = clean_data[target_col].corr(clean_data[feature])
                correlations[feature] = float(corr) if not pd.isna(corr) else 0
            
            return {
                "target_variable": target_col,
                "feature_variables": list(feature_cols),
                "correlations": correlations,
                "sample_size": len(clean_data),
                "recommendation": "Güçlü korelasyonlara sahip değişkenler tahminleme modeli için uygun olabilir"
            }
            
        except Exception as e:
            return {"error": f"Tahminsel analiz hatası: {str(e)}"}

def main():
    """Ana fonksiyon - command line'dan çağrılabilir"""
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Dosya yolu gerekli"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": "Dosya bulunamadı"}))
        sys.exit(1)
    
    try:
        service = PythonAnalysisService()
        result = service.analyze_file(file_path)
        
        # JSON çıktısı
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Servis hatası: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main() 