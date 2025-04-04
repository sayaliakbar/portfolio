# SSL Certificates

Place your SSL certificate files in this directory for HTTPS support:

1. `private.key` - Your private key file
2. `certificate.crt` - Your certificate file

## How to obtain SSL certificates:

### For Production:

- Purchase a certificate from a trusted Certificate Authority (CA) like Let's Encrypt, DigiCert, Comodo, etc.
- Or use a free certificate from Let's Encrypt: https://letsencrypt.org/

### For Local Development/Testing:

Generate a self-signed certificate using OpenSSL:

```bash
# Generate a private key
openssl genrsa -out private.key 2048

# Generate a certificate signing request
openssl req -new -key private.key -out certificate.csr

# Generate a self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in certificate.csr -signkey private.key -out certificate.crt
```

Note: Self-signed certificates will show security warnings in browsers. Only use them for testing purposes.
