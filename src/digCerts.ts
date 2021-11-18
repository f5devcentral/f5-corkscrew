

// https://stackoverflow.com/questions/58724396/parse-x509-certificate-string-in-node
// https://stackoverflow.com/questions/56771030/node-js-how-to-check-get-ssl-certificate-expiry-date


const x = 
{
    "sys": {
        "file": {
            "ssl-cert": {
                "/Common/Dev_Issuing_CA_02.crt": "\n    cache-path /config/filestore/files_d/Common_d/certificate_d/:Common:Dev_Issuing_CA_02.crt_69195_1\n    revision 1\n",
                "/Common/Dev_Root_CA.crt": "\n    cache-path /config/filestore/files_d/Common_d/certificate_d/:Common:Dev_Root_CA.crt_69188_1\n    revision 1\n",
                "/Common/DigiCert-Bundle.crt": "\n    cache-path /config/filestore/files_d/Common_d/certificate_d/:Common:DigiCert-Bundle.crt_39149_1\n    revision 1\n",
                "/Common/Entrust-L1Kroot.crt": "\n    cache-path /config/filestore/files_d/Common_d/certificate_d/:Common:Entrust-L1Kroot.crt_159905_1\n    revision 1\n",
            },
            "ssl-key": {
                "/Common/venafi_test_cert.key": "\n    cache-path /config/filestore/files_d/Common_d/certificate_key_d/:Common:venafi_test_cert.key_39141_1\n    revision 1\n",
            }
        }
    }
}