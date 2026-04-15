FROM dpage/pgadmin4:9
USER pgadmin
RUN mkdir -p  /var/lib/pgadmin/
COPY servers.json /pgadmin4/
COPY pgpass /var/lib/pgadmin/
USER root
RUN chown 5050:5050 /var/lib/pgadmin/pgpass
RUN chmod 0600 /var/lib/pgadmin/pgpass
USER pgadmin
ENTRYPOINT ["/entrypoint.sh"]